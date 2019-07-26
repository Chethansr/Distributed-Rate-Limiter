const Shopify = require('shopify-api-node');

const shopify = new Shopify({
  shopName: 'csnarvar.myshopify.com',
  accessToken: 'd07a46f0fdc546f9ecfeca4fc3706c5f',
  // autoLimit: { calls: 2, interval: 3000, bucketSize: 40 }
});

/*shopify.on('callLimits', limits => {
  console.log("limits \n" + JSON.stringify(limits))
});*/

var successCnt = 0;
var errorCnt = 0;
for (i = 0; i < 45; i++) {
  shopify.productImage.list('1864856240179')
    .then(product => {
      //console.log(JSON.stringify(product));
      console.log(++successCnt);
    })
    .catch(err => {
      console.error(err);
      //console.log(++errorCnt);
    })
}