const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const Bottleneck = require("bottleneck/es5");
const Shopify = require('shopify-api-node');

var successCnt = 0;

const shopify = new Shopify({
  shopName: 'csnarvar.myshopify.com',
  accessToken: 'd07a46f0fdc546f9ecfeca4fc3706c5f',
  //autoLimit: { calls: 2, interval: 1000, bucketSize: 40 }
});

const limiter = new Bottleneck({

  reservoir: 40, // initial value
  reservoirIncreaseAmount: 2,
  reservoirIncreaseInterval: 1000,
  reservoirIncreaseMaximum: 40,
  maxConcurrent: 5,
  minTime: 250,
  id: "shopify-test-rate-limit",
  datastore: "redis",
  clearDatastore: false,
  clientOptions: {
    host: "127.0.0.1",
    port: 6379
  }
});

// Listen to the "failed" event
limiter.on("failed", async(error, jobInfo) => {});

// Listen to the "retry" event
limiter.on("retry", (error, jobInfo) => console.log(`Now retrying ${jobInfo.options.id}`));

getShopifyProductInfo = async function() {
  return shopify.productImage.list('1864856240179')
    .then(product => {
      console.log(++successCnt);
      return JSON.stringify(product);
    })
    .catch(err => {
      return err;
    });
}

const wrapped = limiter.wrap(getShopifyProductInfo);
const main = async function() {
  //toggle comment on below 2 lines to create the rate limit issue with just await getShopifyProductInfo() 
  const result = await wrapped();
  //const result = await getShopifyProductInfo();
  console.log(result + "\n");
}


if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  http.createServer((req, res) => {
    res.writeHead(200);
    main();
    res.end();
  }).listen(9808);

  console.log(`Worker ${process.pid} started`);
}