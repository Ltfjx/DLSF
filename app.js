const express = require('express')
const encryptAES = require('./crypto')
const simpleGit = require('simple-git');

const app = express()
const safeMode = true
// 此变量将决定是否开启后端安全模式
// 如果开启，后端将限制访问 IP 为本机
// 如果你需要在其他设备上访问，请关闭此变量
// !!不要在不受信任的网络环境中关闭安全模式!!
const port = 3000

cookie = {}

if (safeMode) {
    app.use((req, res, next) => {
        const allowedIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1']
        const clientIp = req.ip
        if (!allowedIps.includes(clientIp)) {
            res.status(403).send('DLSF_FORBIDDEN')
        } else {
            next()
        }
    })
} else {
    console.log("!! 当前安全模式已关闭，在公共网络环境下可能遭受攻击！")
}

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
                console.log(j)
                res.json(j)
            } catch (error) {
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
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
                console.log(j)
                res.json(j)
            } catch (error) {
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
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
                console.log(j)
                res.json(j)
            } catch (error) {
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
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
                console.log(j)
                res.json(j)
            } catch (error) {
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
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
                console.log(j)
                res.json(j)
            } catch (error) {
                console.log(error)
                res.json({ "DLSF_SUCCESS": false })
            }
        })
        .catch(error => {
            console.log(error)
            res.json({ "DLSF_SUCCESS": false })
        })
})

app.get('/api/loginGetToken', (req, res) => {
    const username = req.query.username
    const unsalted_password = req.query.password
    fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin")
        .then(response => {
            const cookie = response.headers.getSetCookie()
            console.log(cookie)
            response.text().then(result => {
                const pwdDefaultEncryptSalt = result.match(/var pwdDefaultEncryptSalt = "(.*?)";/)[1]
                console.log(pwdDefaultEncryptSalt)
                const password = encryptAES(unsalted_password, pwdDefaultEncryptSalt)
                const lt = result.match(/name="lt" value="(.*?)"/)[1]
                const dllt = "userNamePasswordLogin"
                const execution = result.match(/name="execution" value="(.*?)"/)[1]
                const _eventId = "submit"
                const rmShown = "1"
                console.log(password)
                console.log(lt)
                console.log(dllt)
                console.log(execution)
                console.log(_eventId)
                console.log(rmShown)

                try {
                    const route = cookie[0].match(/route=(.*?);/)[1]
                    const JSESSIONID_AUTH = cookie[1].match(/JSESSIONID_AUTH=(.*?);/)[1]
                    console.log(route)
                    console.log(JSESSIONID_AUTH)


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

                    console.log(options)

                    fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin", options).then(response => {
                        console.log(response)
                        console.log(response.headers)
                        response.text().then(data => console.log(data))

                        let url
                        try {
                            url = response.headers.get('location').replace("http://", "https://")
                        } catch (error) {
                            console.log(error)
                            res.json({ "DLSF_SUCCESS": false })
                            return
                        }

                        console.log(url)
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
                            console.log(response.headers.get('set-cookie'))
                            const scookie = response.headers.get('set-cookie')
                            const JSESSIONID = scookie.match(/JSESSIONID=(.*?);/)[1]
                            const array = scookie.match(/array=(.*?);/)[1]
                            console.log(JSESSIONID, array)
                            res.json({ "DLSF_SUCCESS": true, "JSESSIONID": JSESSIONID, "array": array })
                        })


                    })

                } catch (error) {
                    console.log(error)
                    res.json({ "DLSF_SUCCESS": false })
                    return
                }

            })
        })
        .catch(error => {
            console.log(error)
        })

})

const git = simpleGit()

app.get('/api/version', async (req, res) => {
    try {
        const log = await git.log()
        const currentCommit = log.latest.hash
        res.json({ "currentVersion": currentCommit })
    } catch (err) {
        console.error(err)
        res.status(500).json({ "DLSF_SUCCESS": false })
    }
})

app.get('/api/ping', (req, res) => {
    res.send("OK")
})

app.use(express.static('public'))

app.listen(port, () => {
    console.log(`
██████╗ ██╗     ███████╗    ███████╗██╗   ██╗ ██████╗██╗  ██╗███████╗██████╗ 
██╔══██╗██║     ██╔════╝    ██╔════╝██║   ██║██╔════╝██║ ██╔╝██╔════╝██╔══██╗
██║  ██║██║     ███████╗    █████╗  ██║   ██║██║     █████╔╝ █████╗  ██████╔╝
██║  ██║██║     ╚════██║    ██╔══╝  ██║   ██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██████╔╝███████╗███████║    ██║     ╚██████╔╝╚██████╗██║  ██╗███████╗██║  ██║
╚═════╝ ╚══════╝╚══════╝    ╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝                                                                       
`)
    console.log("!!! 即将启动浏览器，在使用过程中不要关闭本窗口！")
    console.log("")
    console.log("===============================================================")
})

import("open").then((open) => {
    open.default('http://localhost:' + port)
})
