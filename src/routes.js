const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ request, page }, requestQueue) => {
    log.info(`Processing ${request.url}.`);

    await Apify.utils.enqueueLinks({
        page,
        requestQueue,
        selector: '.widgetId\\=search-results a',
        pseudoUrls: [ 'https://www.amazon.com/[.*]/dp/[.*]' ],
        transformRequestFunction: req => {
            req.userData.label = 'DETAIL';
            return req;
        },
    });
};

exports.handleList = async ({ request, page }) => {
    log.info(`Processing ${request.url}.`);

    const url = request.url;
    const asin = url.substring(url.lastIndexOf("/") + 1);

    const offers = await page.$$eval('.olpOffer', offers => {
        const scrapedData = [];

        offers.forEach(offer => {
            const price = offer.querySelector('.olpOfferPrice').innerHTML;
            let sellerName = offer.querySelector('.olpSellerName').innerHTML;

            // Seller's name's taken from image alt when there's no text (Amazon's offers)
            if (!sellerName){
                const sellerImg = offer.querySelector('.olpSellerName > img');
                if (sellerImg) {
                    sellerName = sellerImg.alt;
                }
            }

            // When shipping price is absent, it's assumed to be free
            let shipping = 'free'
            const shippingPriceElement = offer.querySelector('.olpShippingPrice');
            if(shippingPriceElement){
                shipping = shippingPriceElement.innerHTML;
            }

            scrapedData.push({ sellerName: sellerName, price: price, shipping: shipping });
        });

        return scrapedData;
    });

    const dataset = await Apify.openDataset('amazon-product-dataset');
    const product = request.userData.data;

    // Combine product detail with offers and save to result dataset
    await offers.forEach(async offer => {
        await dataset.pushData({
            title: product.title,
            url: product.url,
            description: product.description,
            keyword: product.keywords,
            sellerName: Apify.utils.htmlToText(offer.sellerName),
            price: Apify.utils.htmlToText(offer.price),
            shippingPrice: Apify.utils.htmlToText(offer.shipping)
        });
    });

    log.info(`Product ${asin} was successfully scraped.`);
};

exports.handleDetail = async ({ request, page }, requestQueue) => {
    log.info(`Processing ${request.url}.`);

    const url = request.url;
    const asin = getAsinFromDetailUrl(url);

    // Are there any offers available?
    const offersLinkWidgetCount = await page.$$eval('.olp-link-widget', lw => lw.length);
    if(offersLinkWidgetCount > 0){
        const title = await page.$eval('meta[name=\'title\']', t => t.content);
        const description = await page.$eval('meta[name=\'description\']', d => d.content);
        const keywords = await page.$eval('meta[name=\'keywords\']', k => k.content);
        const product = { title: title, description: description, keywords: keywords, url: url };
        
        const offersLink = `https://www.amazon.com/gp/offer-listing/${asin}`;
        await requestQueue.addRequest({ 
            url: offersLink,  
            userData: { 
                label: 'OFFERS',
                data: product
            }
        });
    }
    else{
        log.info(`Product ${asin} has no offers and was skipped.`);
    }
};

function getAsinFromDetailUrl(url){
    return url.match(/\/dp\/[0-9A-Z]{10}\//)[0].substring(4,14);
}