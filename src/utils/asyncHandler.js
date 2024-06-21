const asyncHandler=(reqHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(reqHandler(req,res,next))
        .catch((err)=>{next(err)});
    } 
}

// const asyncHandler = (fn)=async(req,res,next)=>{
//     try{
//         await fn(req,res,next);
//     }catch(error){
//         res.send(error.code).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
export {asyncHandler}