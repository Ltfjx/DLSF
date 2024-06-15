var express = require('express')

const app = express()

cookie = {}

app.get('/api/studentui/initstudinfo', (req, res) => {

    let config = {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${cookie.j};array=${cookie.a};`,
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
            'Cookie': `JSESSIONID=${cookie.j};array=${cookie.a};`,
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
            'Cookie': `JSESSIONID=${cookie.j};array=${cookie.a};`,
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

app.post('/api/setToken', (req, res) => {
    cookie.j = req.query.j
    cookie.a = req.query.a
    cookie.i = req.query.i
    console.log(cookie)
    res.json(cookie)
})

app.get('/api/ping', (req, res) => {
    res.send("OK")
})

app.use(express.static('public'))

app.listen(80, () => {
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
    open.default('http://localhost')
})
