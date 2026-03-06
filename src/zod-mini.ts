export function sg<T extends string> (
        data: any, 
        securtyVariaty: Record<T, any>, 
        queue: Partial<Record<T, ReturnType<typeof ds>>>) 
    {
    const QUEUE_KEY = Object.keys(queue || {})

    let queue_task: Function[] = []
    let queue_task_key: string[] = []

    QUEUE_KEY.forEach(key => {
        const selectedFunc = securtyVariaty[key]
        queue_task_key.push(key)
        queue_task.push(selectedFunc)
    })

    let isSuccess = true
    let issue: any[] = []
    queue_task.forEach((func, i) => {
        const curr_queue_key = queue_task_key[i]
        const {expectedValue, errmsg} = queue![curr_queue_key]
        try {
            const execute = func(data, expectedValue)
            if (!execute) throw Error()
        } catch {
            isSuccess = false
            issue.push({
                errmsg,
                loc: curr_queue_key
            })
        }
    })
    return isSuccess ? {isSuccess, data} : {isSuccess, issue}
}
export function ds (expectedValue: any, errmsg: string) {
    return {expectedValue, errmsg}
}


type obj = Record<string, any>
// Untuk transformer layer
type transformerFunc = (tf_into: any, currData: any) => any
export type transformer_obj_scheme<T extends string> = Record<any, Partial<Record<T, any>>>
// Untuk security layer
export type expected_obj_scheme <T extends string> = Record<any, Partial<Record<T, ReturnType<typeof ds>>>>
type boolFunc = (raw: any, expected_to_be: any) => boolean

type setup_arr_scheme<E extends string, T extends string> = [expected_obj_scheme<E>, transformer_obj_scheme<T>?]

export class Q_GuardEngine<E extends string, T extends string> {
    securityMiddleware: Record<E, boolFunc>
    transformerMiddleware: Record<T, transformerFunc>
    constructor (securityMiddleware: Record<E, boolFunc>, transformerMiddleware?: Record<T, transformerFunc>) {
        this.securityMiddleware = securityMiddleware
        this.transformerMiddleware = transformerMiddleware as any
    }

    oz = (obj: obj, setup_arr: setup_arr_scheme<E, T>) => {
        const securityList = this.securityMiddleware
        const transformerList = this.transformerMiddleware
        // All keys
        const [expected_obj_setup, transformer_obj_setup] = setup_arr

        const TRANSFORMER_OBJ_KEY = Object.keys(transformer_obj_setup || {})
        const EXPECTED_OBJ_KEY = Object.keys(expected_obj_setup)

        let isSuccess = true
        let issue: any[] = []
        let currData = {}

        // Checking key first
        for (const key_ex of EXPECTED_OBJ_KEY) {
            if (!obj[key_ex]) {
                isSuccess = false
                issue.push({
                    loc: key_ex,
                    errmsg: `Obj ${key_ex} not found`,
                    layer: 'security_check'
                })
                break
            }
            // Go through security layer
            const expectedValue_key = Object.keys(expected_obj_setup[key_ex])
            for (const list_check_key of expectedValue_key) {
                // console.log(`Security layer => ${list_check_key}`)
                const target_func = securityList[list_check_key]
                const {expectedValue, errmsg} = expected_obj_setup[key_ex][list_check_key]
                const execute = target_func(obj[key_ex], expectedValue)
                if (!execute) {
                    isSuccess = false
                    issue.push({
                        loc: key_ex,
                        onCheck: list_check_key,
                        errmsg,
                        layer: 'security_check'
                    })
                    break
                }

            }
            
        }
        if (TRANSFORMER_OBJ_KEY.length != 0 && isSuccess) {
            for (let key_tf of TRANSFORMER_OBJ_KEY) {
                if (!obj[key_tf]) {
                    isSuccess = false
                    issue.push({
                        loc: key_tf,
                        errmsg: `Obj ${key_tf} Not found`,
                        layer: 'transform_layer'
                    })
                    break
                }
                const transformerValue = Object.keys(transformer_obj_setup![key_tf])
                for (const tf_list_key of transformerValue) {
                    const tf_into = transformer_obj_setup![key_tf][tf_list_key]
                    const choosedFunc = transformerList[tf_list_key]
                    const dataForFunc =  currData[key_tf] ? currData[key_tf] : obj[key_tf]
                    let data = choosedFunc(tf_into, dataForFunc)
                    // console.log(`Transformer Layer => ${tf_list_key}`)
                    currData[key_tf] = data
                }
            }
        }
        return isSuccess ? {isSuccess, data: TRANSFORMER_OBJ_KEY.length != 0 ? {...obj, ...currData} : obj} : {isSuccess, issue}
    }
}




