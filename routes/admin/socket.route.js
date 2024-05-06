const router = require("express").Router()

module.exports = (io) => {
    router.get("/users", (req, res) => {
        io.on("connection", (socket) => {
            socket.emit("user", "salom clientss")
            socket.on("user:show", (data) => {
                console.log(data)
            })
        })
    })

    return router
}