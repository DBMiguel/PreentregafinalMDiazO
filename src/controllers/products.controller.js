import {Router} from "express"
import {Product} from "../models/product.model.js"

const router = Router()

router.get("/", async (req,res)=>{

let {limit=10,page=1,sort,query} = req.query

let filter={}

if(query){

if(query==="available"){

filter.stock={$gt:0}

}else{

filter.category=query

}

}

let options={

limit:parseInt(limit),
page:parseInt(page)

}

if(sort){

options.sort={price:sort==="asc"?1:-1}

}

const result = await Product.paginate(filter,options)

res.json({

status:"success",
payload:result.docs,
totalPages:result.totalPages,
prevPage:result.prevPage,
nextPage:result.nextPage,
page:result.page,
hasPrevPage:result.hasPrevPage,
hasNextPage:result.hasNextPage,
prevLink:result.hasPrevPage?`/api/products?page=${result.prevPage}`:null,
nextLink:result.hasNextPage?`/api/products?page=${result.nextPage}`:null

})

})

export default router