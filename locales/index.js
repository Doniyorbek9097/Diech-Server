const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');
const i18nextMiddleware = require('i18next-express-middleware');

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: __dirname + '/src/locales/{{lng}}/{{ns}}.json'
        },
        fallbackLng: 'en',
        preload: ['en']
    });


    module.exports = i18nextMiddleware.handle(i18next);