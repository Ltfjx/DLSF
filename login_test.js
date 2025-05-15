const forge = require('node-forge')
const axios = require('axios')
const log4js = require('log4js')

const logger = log4js.getLogger()
logger.level = 'debug'

const username = "AAA"
const password = "BBB"

// STEP 1
logger.debug("CAS STEP 1")

const app = "gateway"
const _ = Date.now()
logger.debug(`GET Policy PROCESS: https://cas.dhu.edu.cn/esc-sso/authn/policy?_=${_}&app=${app}`)
axios.get(`https://cas.dhu.edu.cn/esc-sso/authn/policy?_=${_}&app=${app}`).then(response => {
    const policy = response.data
    logger.info(`GET Policy OK`)
    const { publicKey, publicKeyId } = policy.data.param
    logger.debug(`Public Key: ${publicKey}`)
    logger.debug(`Public Key ID: ${publicKeyId}`)

    // STEP 2
    logger.debug("CAS STEP 2")
    const pem = `-----BEGIN PUBLIC KEY-----\n${publicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`
    logger.debug(`PEM:\n`, pem)
    const pubKey = forge.pki.publicKeyFromPem(pem)
    const encryptedBytes = pubKey.encrypt(password, 'RSAES-PKCS1-V1_5')
    const encryptedBase64 = forge.util.encode64(encryptedBytes)
    logger.info("Encrypted Password: ", encryptedBase64)

    // STEP 3
    logger.debug("CAS STEP 3")
    const _ = Date.now()

    const data = {
        "authType": "webLocalAuth",
        "dataField": {
            "username": username,
            "password": encryptedBase64,
            "publicKeyId": publicKeyId
        },
        "extendField": {
            "app": app
        }
    }
    axios.post(`https://cas.dhu.edu.cn/esc-sso/authn/login?_=${_}`, data).then(response => {
        const result = response.data
        logger.info(`POST Login OK`)

        const setCookieHeaders = response.headers['set-cookie']

        let cookieHeader = ''
        if (Array.isArray(setCookieHeaders)) {
            cookieHeader = setCookieHeaders
                .map(cookie => cookie.split(';')[0])
                .join('; ')
        }

        logger.debug(`Cookies: ${cookieHeader}`)

        axios.get('https://cas.dhu.edu.cn/esc-sso/login', {
            maxRedirects: 0,
            params: {
                'service': 'http://jwgl.dhu.edu.cn/dhu/casLogin'
            }, headers: {
                'Cookie': cookieHeader
            }
        }).catch(result => {
            axios.get(result.response.headers.location.replace("http://", "https://"), {
                maxRedirects: 0
            }).catch(resultFinal => {
                const setCookie = resultFinal.response.headers['set-cookie']
                logger.debug(`Final Cookies: ${setCookie}`)
                const JSESSIONID = setCookie[0].match(/JSESSIONID=(.*?);/)[1]
                const array = setCookie[1].match(/array=(.*?);/)[1]
                logger.debug(`JSESSIONID: ${JSESSIONID}`)
                logger.debug(`Array: ${array}`)
                logger.info(`Login Success!`)
            })

        })

    }).catch(error => {
        logger.error(`POST Login ERROR: ${error}`)
    })
}).catch(error => {
    logger.error(`GET Policy ERROR: ${error}`)
})