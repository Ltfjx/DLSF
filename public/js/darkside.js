var buttonDarksideCounter = 0
var isDarkside = false

function initDarkside() {
    Array.from(document.getElementsByClassName("darkside")).forEach(element => {
        element.style["display"] = "none"
    })
}
initDarkside()

function buttonDarkside() {
    buttonDarksideCounter++
    setTimeout(() => {
        buttonDarksideCounter--
    }, 5000)
    if (buttonDarksideCounter >= 7 || isDarkside) {
        if (!isDarkside) { startDarkside() }
        mdui.snackbar({
            message: `您已处于 Darkside`,
            placement: "top"
        })
    } else if (buttonDarksideCounter >= 4) {
        mdui.snackbar({
            message: `还需 ${7 - buttonDarksideCounter} 步即可进入 Darkside`,
            placement: "top"
        })
    }
}

function startDarkside() {
    isDarkside = true
    mdui.setColorScheme("#FF0000")

    Array.from(document.getElementsByClassName("darkside")).forEach(element => {
        element.style["display"] = "block"
    })

    Array.from(document.getElementsByClassName("darkside-invisible")).forEach(element => {
        element.style["display"] = "none"
    })

    document.getElementById("dialog-darkside").open = true
    setTimeout(() => {
        document.getElementById("dialog-darkside").open = false
    }, 3000)
}
