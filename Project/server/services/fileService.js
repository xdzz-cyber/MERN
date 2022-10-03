const fs = require("fs")
const File = require("../models/File")
const config = require("config")

class FileService{
    createDir(file){
        const filePath = `${config.get("filePath")}\\${file.user}\\${file.path}`

        return new Promise((resolve, reject) => {
            try{
                if(!fs.existsSync(filePath)){
                    fs.mkdirSync(filePath)
                    return resolve("File has been created")
                } else{
                    return reject("File already exists")
                }
            } catch (e){
                return reject("shit file passed into file service")
            }
        })
    }
}

module.exports = new FileService()
