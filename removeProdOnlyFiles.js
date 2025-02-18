require('babel-register')({
    presets: [ 'es2015', 'react' ]
});
require('dotenv').config({ path: './.env' })
const fs = require('fs');
// const router = require('./src/sitemap-routes').default;
// const Sitemap = require('react-router-sitemap').default;
// async function generateSitemap() {

//     const getAppUrl = () => {
//         switch(process.env.REACT_APP_NODE_ENV){
//         case 'development':
//             return 'https://dev.webfin.co'
//         case 'staging':
//             return 'https://wizrd.biz'
//         case 'production':
//             return 'https://wizrd.org'
//         default:
//             return 'https://wizrd.org'
//         }
//     }
//     try {
//         return (
//             new Sitemap(router)
//                 .build(getAppUrl())
//                 .save('./public/sitemap.xml')
//         );
//     } catch(e) {
//         console.log(e);
//     }

// }

// generateSitemap();
if(process.env.REACT_APP_NODE_ENV !== 'production'){
    try {
        fs.unlinkSync('./build/sitemap.xml');
        fs.unlinkSync('./build/robots.txt');
    } catch (e) {
        console.log('Error in removeProdOnlyFiles.js', e)
    }
}