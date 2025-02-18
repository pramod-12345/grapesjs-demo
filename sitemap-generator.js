require('babel-register')({
    presets: [ 'es2015', 'react' ]
});
require('dotenv').config({ path: './.env' })
const router = require('./src/sitemap-routes').default;
const Sitemap = require('react-router-sitemap').default;
async function generateSitemap() {

    const getAppUrl = () => {
        switch(process.env.REACT_APP_API_URL){
        case 'https://dev-api.webfin.co/api':
            return 'https://dev.webfin.co'
        case 'https://uat-api.webfin.co/api':
            return 'https://wizrd.biz'
        case 'https://api.wizrd.org/api':
            return 'https://wizrd.org'
        default:
            return 'https://wizrd.org'
        }
    }
    try {
        return (
            new Sitemap(router)
                .build(getAppUrl())
                .save('./public/sitemap.xml')
        );
    } catch(e) {
        console.log(e);
    }

}

generateSitemap();
