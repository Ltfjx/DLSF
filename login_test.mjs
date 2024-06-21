import * as crypto from "./crypto.js"
const username = "a"
const unsalted_password = "b"
fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin")
    .then(response => {
        const cookie = response.headers.getSetCookie()
        console.log(cookie)
        response.text().then(result => {
            const pwdDefaultEncryptSalt = result.match(/var pwdDefaultEncryptSalt = "(.*?)";/)[1]
            console.log(pwdDefaultEncryptSalt)
            console.log("========")
            const password = crypto.encryptAES(unsalted_password, pwdDefaultEncryptSalt)
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
                "body": `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&lt=${encodeURIComponent(lt)}&dllt=${encodeURIComponent(dllt)}&execution=${encodeURIComponent(execution)}&_eventId=${encodeURIComponent(_eventId)}&rmShown=${encodeURIComponent(rmShown)}`,
                "method": "POST",
                "redirect": 'manual'
            }

            console.log(options)

            fetch("https://cas.dhu.edu.cn/authserver/login?service=http%3A%2F%2Fjwgl.dhu.edu.cn%2Fdhu%2FcasLogin", options).then(response => {
                console.log(response)
                console.log(response.headers)
                response.text().then(data => console.log(data))

                const url = response.headers.get('location').replace("http://", "https://")
                console.log(1)
                console.log(url)
                console.log(1)
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
                })


            })

        })
    })
    .catch(error => {
        console.log(error)
    })
