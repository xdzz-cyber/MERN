const fileService = require("../services/fileService")
const User = require("../models/User")
const File = require("../models/File")
const config = require("config")
const fs = require("fs")

class FileController{
    async createDir(req,res){
        try{
            const {name, type, parent} = req.body;

            const file = new File({name, type, parent, user: req.user.id})

            const parentFile = await File.findOne({_id: parent})

            if(!parentFile){
                file.path = name;
                await fileService.createDir(file)
            } else{
                file.path = `${parentFile.path}\\${file.name}`;
                await fileService.createDir(file)
                parentFile.children.push(file._id)
                await parentFile.save()
            }

            await file.save()

            return res.json(file)
        } catch (e){

        }
    }

    async fetchFiles(req, res){
        try{
            const files = await File.find({user: req.user.id, parent: req.query.parent})

            return res.json(files)
        } catch (e){
            console.log(e)
            return res.status(500).json("can't get files")
        }
    }

    async uploadFile(req,res){
        try{
            const file = req.files.file;
            const parentDir = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user=  await User.findOne({_id: req.user.id})

            if(user.usedSpace + file.size > user.diskSpace){
                return res.status(400).json("Disk if filled up completely")
            }

            user.usedSpace += file.size;

            let path = '';

            if(parentDir){
                path = `${config.get("filePath")}\\${user._id}\\${parentDir.path}\\${file.name}`
            } else{
                path = `${config.get("filePath")}\\${user._id}\\${file.name}`
            }

            if(fs.existsSync(path)){
                return res.status(400).json("File already exists")
            }

            file.mv(path)

            const type = file.name.split(".").pop()
            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: parentDir?.path,
                parent: parentDir?._id,
                user: user?._id
            })

            await dbFile.save()
            await user.save()

            return res.json(dbFile)

        } catch (err){
            console.log(err)
            return res.status(500).json("Upload error")
        }
    }

    async downloadFile(req,res){
        try{
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path = `${config.get("filePath")}\\${req.user.id}\\${file.path}\\${file.name}`

            if(fs.existsSync(path)){
                return res.download(path, file.name)
            }

            return res.status(500).json("cannot send file")
        } catch (e){
            console.log(e)
            return res.status(500).json("serverError")
        }
    }
}

module.exports = new FileController()