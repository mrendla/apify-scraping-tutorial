# Amazon Scraper Tutorial
Scraper demo for Tutorial II Apify SDK.

## Description
This is a scraper that runs in Apify actor and scrapes Amazon for offers with product info from the first page of search for a given keyword. The scraper is based on PuppeteerScrapper and utilizes the standard Puppeteer scraper scaffolding with three handlers for start, detail and list. It uses Apify proxy to avoid being blocked.

## Quiz answers
* Where and how can you use JQuery with the SDK?

You can use it with CheerioCrawler for crawling HTML from plain HTTP requests. It can be used with PuppeteerCrawler as well.

* What is the main difference between Cheerio and JQuery?

Cheerio is for Node.js and JQuery is for the browser.

* When would you use CheerioCrawler and what are its limitations?

For simple pages, especially when we need great performance. It's not always sufficient, for example for pages with a lot of Javascript.

* What are the main classes for managing requests and when and why would you use one instead of another?

Request, RequestList and RequestQueue. RequestList is useful for starting URLs and RequestQueue is best used for links we find during the process of scraping.

* How can you extract data from a page in Puppeteer without using JQuery?

It can access page's Javascript, for example by reading directly from the variables.

* What is the default concurrency/parallelism the SDK uses?

Default parallelism is between 1 and 1000 parallel tasks.