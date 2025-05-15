const express = require('express')
const simpleGit = require('simple-git')
const ejs = require('ejs')
const log4js = require('log4js')
const yaml = require('yaml')
const fs = require('fs')
const WebSocket = require('ws')
const axios = require('axios')
const forge = require('node-forge')

console.log(`
██████╗ ██╗     ███████╗    ███████╗██╗   ██╗ ██████╗██╗  ██╗███████╗██████╗ 
██╔══██╗██║     ██╔════╝    ██╔════╝██║   ██║██╔════╝██║ ██╔╝██╔════╝██╔══██╗
██║  ██║██║     ███████╗    █████╗  ██║   ██║██║     █████╔╝ █████╗  ██████╔╝
██║  ██║██║     ╚════██║    ██╔══╝  ██║   ██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██████╔╝███████╗███████║    ██║     ╚██████╔╝╚██████╗██║  ██╗███████╗██║  ██║
╚═════╝ ╚══════╝╚══════╝    ╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`)
console.log("DLS FUCKER @PotatoDev | 现代世界的魔法师")
console.log("============================================================================")


const logger = log4js.getLogger("main")
logger.level = "trace"
logger.info("DLSF 正在启动...")


var config = {}
try {
    config = yaml.parse(fs.readFileSync('./config.yml', 'utf8'))
} catch (error) {
    if (!fs.existsSync('./config.yml')) {
        logger.warn("配置文件不存在，正在创建默认配置...")
        fs.copyFileSync('./config.yml.default', './config.yml')
        config = yaml.parse(fs.readFileSync('./config.yml', 'utf8'))
    } else {
        logger.error("配置文件解析失败，请检查配置文件是否存在或格式是否正确或直接删除目录下 config.yaml 文件并重启程序")
        console.log(error)
        process.exit(1)
    }
}
logger.level = config.log_level
logger.info("配置文件加载成功")
logger.trace(config)

const app = express()
const safeMode = config.safe_mode
const port = config.port

if (safeMode) {
    app.use((req, res, next) => {
        const allowedIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1']
        const clientIp = req.ip
        if (!allowedIps.includes(clientIp)) {
            res.status(403).send('DLSF_403_FORBIDDEN')
            logger.debug(`阻挡外部访问 IP：${clientIp}`)
        } else {
            next()
        }
    })
} else {
    logger.warn("当前安全模式已关闭，在公共网络环境下可能遭受攻击！")
}

app.use((req, res, next) => {
    if (!req.url.startsWith("/api")) {
        logger.debug("STATIC" + " " + req.url)
    } else if (!req.url.endsWith("/ping")) {
        logger.info("API " + req.method + " " + req.url.split("&j=")[0]) // 去除 token 参数
    }
    next()
})


app.get('/api/studentui/initstudinfo', (req, res) => {

    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch("https://jwgl.dhu.edu.cn/dhu/studentui/initstudinfo", config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/studentui/initstudinfo")
                res.json(j)
            } catch (error) {
                logger.error("/api/studentui/initstudinfo 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/studentui/initstudinfo 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })

})

app.get('/api/selectcourse/initACC', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch("https://jwgl.dhu.edu.cn/dhu/selectcourse/initACC?courseCode=" + req.query.courseCode, config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/selectcourse/initACC", { "courseCode": req.query.courseCode })
                res.json(j)
            } catch (error) {
                logger.error("/api/selectcourse/initACC 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/selectcourse/initACC 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.post('/api/selectcourse/scSubmit', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch("https://jwgl.dhu.edu.cn/dhu/selectcourse/scSubmit?cttId=" + req.query.cttId, config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/selectcourse/scSubmit", { "cttId": req.query.cttId })
                res.json(j)
            } catch (error) {
                logger.error("/api/selectcourse/scSubmit 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })

            }
        })
        .catch(error => {
            logger.error("/api/selectcourse/scSubmit 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/common/semesterSS', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch("https://jwgl.dhu.edu.cn/dhu/common/semesterSS?ordered=true&sortType=desc", config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/common/semesterSS")
                res.json(j)
            } catch (error) {
                logger.error("/api/common/semesterSS 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/common/semesterSS 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/StudentCourseTable/getData', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch(`https://jwgl.dhu.edu.cn/dhu/StudentCourseTable/getData?studentCode=${req.query.studentCode}&yearTermId=${req.query.yearTermId}&yearTermName=${req.query.yearTermName}`, config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/StudentCourseTable/getData", { "studentCode": req.query.studentCode, "yearTermId": req.query.yearTermId, "yearTermName": req.query.yearTermName })
                res.json(j)
            } catch (error) {
                logger.error("/api/StudentCourseTable/getData 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/StudentCourseTable/getData 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/PublicQuery/getSelectCourseTermList', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch(`https://jwgl.dhu.edu.cn/dhu/PublicQuery/getSelectCourseTermList?termId=${req.query.termId}&iDisplayStart=${0}&iDisplayLength=${10000}`, config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/PublicQuery/getSelectCourseTermList", { "termId": req.query.termId })
                res.json(j)
            } catch (error) {
                logger.error("/api/PublicQuery/getSelectCourseTermList 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/PublicQuery/getSelectCourseTermList 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/selectcourse/initSelCourses', (req, res) => {
    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${req.query.j};array=${req.query.a};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Host': 'jwgl.dhu.edu.cn'
        }
    }

    fetch(`https://jwgl.dhu.edu.cn/dhu/selectcourse/initSelCourses`, config)
        .then(response => response.text())
        .then(result => {
            let j
            try {
                j = JSON.parse(result)
                logger.info("API OK /api/selectcourse/initSelCourses")
                res.json(j)
            } catch (error) {
                logger.error("/api/PublicQuery/getSelectCourseTermList 解析 JSON 失败：")
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            logger.error("/api/PublicQuery/getSelectCourseTermList 请求失败：")
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/dlsf/loginGetToken', (req, res) => {
    const username = req.query.username
    const password = req.query.password

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
            logger.info(`POST Login Result: `, result)

            if (result.code == "IAM031006") {
                logger.error("Wrong Username or Password")
                res.json({ "DLSF_SUCCESS": false, "message": "用户名或密码错误" })
                return
            }

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
                    res.json({ "DLSF_SUCCESS": true, "JSESSIONID": JSESSIONID, "array": array })
                })

            })

        }).catch(error => {
            logger.error(`POST Login ERROR: ${error}`)
        })
    }).catch(error => {
        logger.error(`GET Policy ERROR: ${error}`)
    })

})

const git = simpleGit()

app.get('/api/dlsf/version', async (req, res) => {
    try {
        const log = await git.log()
        const currentCommit = log.latest.hash
        res.json({ "currentVersion": currentCommit })
    } catch (err) {
        logger.warn("当前环境未安装 Git，自动更新检查功能将不会生效")
        res.status(500).json({ "DLSF_SUCCESS": false })
    }
})

app.get("/", (req, res) => {
    ejs.renderFile("./views/index/index.ejs").then(html => {
        res.send(html)
    })
})

app.use(express.static('public'))

app.listen(port, () => {
    logger.info("DLSF 已启动：http://localhost:" + port)
})

const wss = new WebSocket.Server({ port: port + 1 })

logger.info("DLSF WebSocket 已启动：http://localhost:" + (port + 1))

wss.on('connection', (ws) => {
    ws.send("Hello DLSF")
})

if (config.auto_satart_browser == true) {
    import("open").then((open) => {
        logger.info("正在启动浏览器...")
        open.default('http://localhost:' + port)
    })
}

