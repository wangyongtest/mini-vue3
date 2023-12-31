

let queue = []
export function queueJob(job){
// 
if(!queue.includes(job)){
    queue.push(job)
    // 执行刷新队列
    queueFlush()
}
}

let isFlushPending = false
function queueFlush (){
    if(!isFlushPending){
        isFlushPending = true
        Promise.resolve().then(flushJobs)
    }
}

function flushJobs(){
    isFlushPending = false
    // 清空时需要根据调用的顺序依次刷新， 保证先刷新父，在刷新子
    queue.sort((a,b)=>a.id - b.id)
    for(let i=0; i< queue.length;i++){
        const job = queue[i]
        job()
    }
    queue.length = 0
}