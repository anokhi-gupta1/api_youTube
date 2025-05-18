
// server.js

const http=require('http')
const app=require('../api/app')
const server=http.createServer(app)
const port =3200
server.listen(port,()=>{
    console.log("app is running")

})
