const express = require('express');
const {v4 : uuidV4} = require("uuid");

const app = express();
const accounts = [];

app.use(express.json());

function verifyIfExistAccount(req, res, next){
  const {cpf} = req.headers;
  const account = accounts.find(account => account.cpf === cpf);

  if(!account)
    return res.status(400).json({error: "There is no account registered with this CPF"});
  req.account = account;
  return next();  
}

function getAccountBalance(statement){
  const balance = statement.reduce((acc, statementOp) => {
    if(statementOp.type === 'withdraw')
      return acc - statementOp.amount;
    else if(statementOp.type === 'deposit')
      return acc + statementOp.amount;
  }, 0);
  return balance;
}

/**
 * Statement
 * 
 * amount
 * type
 * created_at
 */

/**
 * Account
 * 
 * id
 * name
 * cpf
 * statement 
 */
app.post("/account", (req, res) => {
  const {cpf, name} = req.body;
  const accountExists = accounts.some(account => account.cpf === cpf);

  if(accountExists)
    return res.status(400).json({error: "CPF already registered"});

  const account = {
    name, 
    cpf,
    statement: [],
    id: uuidV4()
  }
  accounts.push(account);
  return res.status(200).json({accounts:accounts});
})

app.use(verifyIfExistAccount);

app.get("/account", (req, res) => {
  const {account} = req;
  return res.status(200).json({account: account});
})

app.put("/account", (req, res) => {
  const {account} = req;
  const {name} = req.body;
  account.name = name;
  return res.status(200).json({account: account});
})

app.delete("/account", (req, res) => {
  const {account} = req;
  accounts.splice(accounts.indexOf(account), 1);
  return res.status(200).json({accounts: accounts});
})

app.get("/statement", (req, res) => {
  const {account} = req;  
  return res.status(200).json({statement: account.statement});
})

app.get("/statement/date", (req, res) => {
  const {account} = req;
  const {date} = req.query;
  const dateFormat = new Date(date).setHours(0, 0, 0, 0);

  const statementByDate = account.statement.filter(statementOp => 
    statementOp.createdAt.toDateString() === new Date(dateFormat).toDateString());
  
  if(!statementByDate.length)
    return res.status(400).json({error:"There's no statement registered at this date"})

  return res.status(200).json(statementByDate);
})

app.post("/deposit", (req, res) => {
  const {account} = req;
  const {amount} = req.body;

  const statementOp = {
    amount,
    type: "deposit",
    createdAt: new Date()
  }
  account.statement.push(statementOp);
  return res.status(201).json({statements: account.statement});
})

app.post("/withdraw", (req, res) => {
  const {account} = req;
  const {amount} = req.body;
  const balance = getAccountBalance(account.statement);
  if(balance < amount || balance == 0)
    return res.status(400).json({error: "Insuficient funds"});

  const statementOp = {
    amount,
    type: "withdraw",
    createdAt: new Date()
  }
  account.statement.push(statementOp);
  return res.status(201).json({statements: account.statement});
})

app.listen(3333);