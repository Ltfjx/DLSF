// API
async function apiPing() {

    const baseURL = "http://" + window.location.host + "/api/dlsf"

    let config = {
        method: "GET",
        url: baseURL + "/ping",
        timeout: 1000
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function () {
                resolve(true)
            })
            .catch(function () {
                reject(false)
            })
    })


}

async function api(target, params) {
    if (cancelTokens[target + JSON.stringify(params)]) {
        cancelTokens[target + JSON.stringify(params)]()
    }

    let source = axios.CancelToken.source()
    cancelTokens[target + JSON.stringify(params)] = source.cancel
    if (params) {
        params = { ...params, j: cookie.JSESSIONID, a: cookie.array }
    } else {
        params = { j: cookie.JSESSIONID, a: cookie.array }
    }

    let queryString = params ? Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&') : ''

    const baseURL = "http://" + window.location.host + "/api"

    const methodMap = {
        "/studentui/initstudinfo": "GET",
        "/dlsf/loginGetToken": "GET",
        "/selectcourse/initACC": "GET",
        "/selectcourse/scSubmit": "POST",
        "/common/semesterSS": "GET",
        "/StudentCourseTable/getData": "GET",
        "/dlsf/version": "GET",
        "/PublicQuery/getSelectCourseTermList": "GET",
        "/selectcourse/initSelCourses": "GET"
    }

    let config = {
        method: methodMap[target],
        url: baseURL + target + "?" + queryString,
        cancelToken: source.token
    }

    return new Promise((resolve, reject) => {
        axios(config)
            .then(function (response) {
                console.log(response.data)
                resolve(response.data)
            })
            .catch(function (error) {
                console.log(error)
                if (!error.code == "ERR_CANCELED") {
                    mdui.snackbar({
                        message: target + " API 请求出现了错误，请报告给开发者",
                        closeable: true,
                        placement: "bottom-end"
                    })
                }
                reject(null)
            })
    })

}