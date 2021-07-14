// import library
const express = require("express");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
var multer = require("multer");

// compute app & import sql
const app = express();
let sql = require("./sql.js");

// ===============================================================

// find out env.locl in root folder
dotenv.config({ path: path.join(__dirname, ".env.local") });

//make Storage folder
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + path.extname(file.originalname));
    },
});

// setting storage folder to server storage
var upload = multer({ storage: storage });

//cors
const cors = require("cors");

const corsOption = {
    origin: "http://localhost:8080",
    credentials: true,
};

app.use(cors(corsOption));
app.use(
    express.json({
        limit: "50mb",
    })
);

const server = app.listen(3000, () => {
    var dir = __dirname + "/uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    console.log("Server stared. port 3000.");
});

app.use("/static", express.static(__dirname + "/uploads"));

const dbPool = require("mysql").createPool({
    database: "dev",
    host: "169.254.167.138",
    port: 3307,
    user: "root",
    password: "28660894",
});

// ===============================================================

// post function for upload file
app.post("/api/uploadFile", upload.single("attachment"), async (req, res) => {
    console.log(req.file);
    return res.status(200).json(req.file);
});

// delete function for uploaded file
app.delete("/api/deleteFile", async (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.query.filename);
    console.log(path);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            res.status(400).json({
                type: "E",
                msg: "파일을 삭제할 수 없습니다. 다시 시도하세요.",
            });
        }

        res.status(200).json({ type: "S", msg: "성공적으로 삭제되었습니다." });
    });
});

// get function for get list
app.get("/api/getList", async (req, res) => {
    try {
        res.send(await sys.db("list"));
    } catch (err) {
        res.status(500).send({
            error: err,
        });
    }
});

fs.watchFile(__dirname + "/sql.js", (curr, prev) => {
    console.log("sql 변경시 재시작 없이 반영되도록 함.");
    delete require.cache[require.resolve("./sql.js")];
    sql = require("./sql.js");
});

// vue의 createPerson이 작동
// 일반적으로 그냥 post만 쓰기도 함 app.get 대신 그냥 post로 실행
// alias는 sql.js 내에 있는 하나가 잡힌다
app.post("/api/:alias", async (req, res) => {
    // alias라는 변수에 createPerson이 입력
    console.log(req.params.alias);
    console.log(req.body.param);

    try {
        res.send(
            await sys.db(req.params.alias, req.body.param, req.body.where)
        );
    } catch (err) {
        res.status(500).send({
            error: err,
        });
    }
});

// 우리가 작성한 것들을 실질적으로 전송하는 역할
const sys = {
    async db(alias, param = [], where = "") {
        return new Promise((resolve, reject) =>
            dbPool.query(sql[alias].query + where, param, (error, rows) => {
                if (error) {
                    if (error.code != "ER_DUP_ENTRY") console.log(error);
                    resolve({
                        error,
                    });
                } else resolve(rows);
            })
        );
    },
};