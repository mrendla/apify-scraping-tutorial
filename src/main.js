const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const input = await Apify.getInput();
    const requestList = await Apify.openRequestList('start-url', [ `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${input.keyword}` ]);
    const requestQueue = await Apify.openRequestQueue();
    const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        useSessionPool: true,
        persistCookiesPerSession: true,
        launchPuppeteerOptions: {
            useChrome: true,
            stealth: true
        },
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            switch (label) {
                case 'OFFERS':
                    return handleList(context,);
                case 'DETAIL':
                    return handleDetail(context, requestQueue,);
                default:
                    return handleStart(context, requestQueue);
            }
        },
        handleFailedRequestFunction: async ({ request, error }) => {
            log.error(`Request ${request.url} failed with error: ${error}.`);
            const dataset = await Apify.openDataset('broken-links-dataset');
            await dataset.pushData({ url: request.url, error: error });
        }
    });

    log.info('Starting the crawl.');

    await crawler.run();

    log.info('Crawl finished.');
});