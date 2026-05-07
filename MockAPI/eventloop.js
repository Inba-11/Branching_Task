console.log("start");
setTimeout(()=>{
    console.log.log("SetTimeout ")
},0);
Promise.resolve().then(()=>{
    console.log("Promise Resolved");
});
