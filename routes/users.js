var express = require("express");
var router = express.Router();
var app = express();
var cors = require("cors");
const { mongoDb, mongoClient, dbUrl } = require("../dbConfig");

//checking if a user already exists or not
app.use(cors());
router.get("/:sub", async (req, res) => {
  let sub = req.params.sub;
  let client = await mongoClient.connect(dbUrl);
  try {
    const db = client.db("ExpenseTracker");
    const user = await db.collection("users").findOne({ sub: sub });
    if (user === null) {
      res.send({ statusCode: 200, message: "user doesn't exist", user: {} });
    } else {
      res.send({ statusCode: 200, message: "user already exists", user: user });
    }
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

//create a new user
router.post("/new", async (req, res) => {
  let client = await mongoClient.connect(dbUrl);
  try {
    const db = client.db("ExpenseTracker");
    const newUser = await db.collection("users").insertOne(req.body);
    if (newUser.acknowledged) {
      res.send({ statusCode: 201, message: "new user has been created" });
    }
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

//add a new expense
router.post("/expense", async (req, res) => {
  let client = await mongoClient.connect(dbUrl);

  try {
    console.log(req.body);
    const { category, name, date, description, price, uid } = req.body;
    const db = client.db("ExpenseTracker");
    const newExpense = await db.collection("users").updateOne(
      { sub: req.body.sub },
      {
        $push: {
          expenses: { category, name, date, description, price, uid },
        },
      }
    );
    if (newExpense.acknowledged) {
      res.send({ statusCode: 201, message: "new expense has been created" });
    }
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

//get all expenses
router.get("/expense/:sub", async (req, res) => {
  let sub = req.params.sub;
  let client = await mongoClient.connect(dbUrl);
  try {
    const db = client.db("ExpenseTracker");
    const data = await db.collection("users").findOne({ sub: sub });
    if (data === null) {
      res.send({ statusCode: 500, message: "something went wrong" });
    } else {
      res.send({
        statusCode: 200,
        message: "fetched successfully",
        user: data,
      });
    }
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

//put to a single expense by uid, two params are sent because we are using embedded documents
router.put("/expense/:sub/:uid", async (req, res) => {
  //user identifier
  let sub = req.params.sub;
  let client = await mongoClient.connect(dbUrl);
  try {
    const db = client.db("ExpenseTracker");
    const expense = await db
      .collection("users")
      .findOne({ sub: sub, "expenses.uid": req.params.uid }); //check if the expense exist
    if (expense) {
      const { name, price, category, date, description } = req.body; //destructure for easy of read
      let uid = req.params.uid; //unique identifier of the expense
      const update = await db.collection("users").updateOne(
        { sub: sub, "expenses.uid": req.params.uid },
        {
          $set: {
            "expenses.$": { name, price, category, uid, description, date },
          },
        }
      );
      res.send({
        statusCode: 201,
        message: "updated successfully",
      });
    }
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

//delete an expense
router.delete("/expense/:sub/:uid", async (req, res) => {
  let sub = req.params.sub;
  let uid = req.params.uid;
  let client = await mongoClient.connect(dbUrl);
  try {
    const db = client.db("ExpenseTracker");
    const data = await db.collection("users").updateOne(
      { sub: sub, "expenses.uid": uid },
      {
        $pull: {
          expenses: {
            uid: uid,
          },
        },
      }
    );
    res.send({ statusCode: 200, message: "deleted successfully" });
  } catch (e) {
    res.send({ statusCode: 500, message: "internal server error" });
    console.log(e);
  } finally {
    client.close();
  }
});

module.exports = router;
