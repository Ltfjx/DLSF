const express = require('express')
const encryptAES = require('./utils/encryptAES')
const simpleGit = require('simple-git')
const ejs = require('ejs')
const log4js = require('log4js')
const yaml = require('yaml')
const fs = require('fs')

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
        logger.trace("STATIC" + " " + req.url)
    } else if (!req.url.endsWith("/ping")) {
        logger.debug("API " + req.method + " " + req.url)
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
    const unsalted_password = req.query.password



    fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin")
        .then(response => {
            const cookie = response.headers.getSetCookie()
            response.text().then(result => {
                const pwdDefaultEncryptSalt = result.match(/var pwdDefaultEncryptSalt = "(.*?)";/)[1]
                const password = encryptAES(unsalted_password, pwdDefaultEncryptSalt)
                const lt = result.match(/name="lt" value="(.*?)"/)[1]
                const dllt = "userNamePasswordLogin"
                const execution = result.match(/name="execution" value="(.*?)"/)[1]
                const _eventId = "submit"
                const rmShown = "1"


                const route = cookie[0].match(/route=(.*?);/)[1]
                const JSESSIONID_AUTH = cookie[1].match(/JSESSIONID_AUTH=(.*?);/)[1]


                let options = {
                    "headers": {
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-language": "zh-CN,zh;q=0.9,ja;q=0.8",
                        "cache-control": "max-age=0",
                        "content-type": "application/x-www-form-urlencoded",
                        "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "document",
                        "sec-fetch-mode": "navigate",
                        "sec-fetch-site": "same-origin",
                        "sec-fetch-user": "?1",
                        "upgrade-insecure-requests": "1",
                        "cookie": `route=${encodeURIComponent(route)}; org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=zh_CN; JSESSIONID_AUTH=${encodeURIComponent(JSESSIONID_AUTH)}`,
                        "Referer": "https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    },
                    "body": `username=${encodeURIComponent(username)}`
                        + `&password=${encodeURIComponent(password)}`
                        + `&lt=${encodeURIComponent(lt)}`
                        + `&dllt=${encodeURIComponent(dllt)}`
                        + `&execution=${encodeURIComponent(execution)}`
                        + `&_eventId=${encodeURIComponent(_eventId)}`
                        + `&rmShown=${encodeURIComponent(rmShown)}`,

                    "method": "POST",
                    "redirect": 'manual'
                }


                fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin", options).then(response => {

                    let url
                    try {
                        url = response.headers.get('location').replace("http://", "https://")
                    } catch (error) {
                        console.log(error)
                        res.json({ "DLSF_SUCCESS": false })
                        return
                    }

                    fetch(url, {
                        "headers": {
                            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                            "accept-language": "zh-CN,zh;q=0.9",
                            "cache-control": "no-cache",
                            "pragma": "no-cache",
                            "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": "\"Windows\"",
                            "sec-fetch-dest": "document",
                            "sec-fetch-mode": "navigate",
                            "sec-fetch-site": "none",
                            "sec-fetch-user": "?1",
                            "upgrade-insecure-requests": "1"
                        },
                        "referrerPolicy": "strict-origin-when-cross-origin",
                        "body": null,
                        "method": "GET",
                        "redirect": 'manual'
                    }).then(response => {
                        const scookie = response.headers.get('set-cookie')
                        const JSESSIONID = scookie.match(/JSESSIONID=(.*?);/)[1]
                        const array = scookie.match(/array=(.*?);/)[1]
                        res.json({ "DLSF_SUCCESS": true, "JSESSIONID": JSESSIONID, "array": array })
                    }).catch(error => {
                        res.json({ "DLSF_SUCCESS": false })
                        logger.error("CAS 自动登录 3/3 步骤失败：")
                        console.log(error)
                    })


                }).catch(error => {
                    res.json({ "DLSF_SUCCESS": false })
                    logger.error("CAS 自动登录 2/3 步骤失败：")
                    console.log(error)
                })

            })
        })
        .catch(error => {
            res.json({ "DLSF_SUCCESS": false })
            logger.error("CAS 自动登录 1/3 步骤失败：")
            console.log(error)
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

app.get('/api/dlsf/ping', (req, res) => {
    res.send("OK")
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

if (config.auto_satart_browser == true) {
    import("open").then((open) => {
        logger.info("正在启动浏览器...")
        open.default('http://localhost:' + port)
    })
}

