import {roseliaCustomCommand, Entity, EntityType, askYukina} from '@/common/api/luis'
import {tupleToDict, selfish} from '@/common/helpers'
import router from '@/router/index'


type ExecutorArgument = Partial<EntityType>

const getArguments = (entites: Entity[]): ExecutorArgument => tupleToDict(entites.map(el => [el.type, el.entity] as [string, string]))

export async function executeCommand(command: string) {
    try {
        if (command in executors) {
            executors[command]({})
            return true
        }
    } catch {

    }
    const result = await roseliaCustomCommand({command})
    const intent = result.topScoringIntent.intent
    const args = getArguments(result.entities)
    if (args.Password) {
        const entity = result.entities.find(x => x.type === 'Password')!
        args.Password = command.substring(entity.startIndex, entity.endIndex + 1)
    }
    if (intent in executors) {
        executors[intent](args)
        return true
    }
    return false
}

export const askYukinaForHelp = async (question: string) => (await askYukina({question}))[0]

const preludeExecutors = {
    login({Username, Password}: ExecutorArgument) {
        router.push({
            name: 'login',
            params: {
                credential: {
                    username: Username,
                    password: Password
                }
            } as any
        })
    },
    newPost({PostID}: ExecutorArgument) {
        router.push({
            name: 'edit',
            query: {
                post: PostID
            } as any
        })
    },
    search({PostTag}: ExecutorArgument) {
        router.push({
            name: 'index',
            query: {
                tag: PostTag
            } as any
        })
    },
    showTimeline({Username}: ExecutorArgument) {
        router.push({
            name: Username ? 'userTimeline' : 'timeline',
            params: {
                username: Username
            } as any
        })
    },
    "Utilities.GoBack"() {
        router.go(-1)
    },
    logout() {
        router.push({
            name: 'login',
            params: {
                logout: true
            } as any
        })
    }
}

let contextualExecutors = {

}

const executors = selfish(new Proxy(preludeExecutors, {
    get(target, key) {
        return Reflect.get(contextualExecutors, key) || Reflect.get(target, key)
    },
    has(target, key) {
        return Reflect.has(contextualExecutors, key) || Reflect.has(target, key)
    }
}))

export const pushContext = (funcs: {
    [key: string]: (arg: ExecutorArgument) => void
}, bindContext?: object) => {
    contextualExecutors = {
        ...contextualExecutors,
        ...selfish(funcs, bindContext)
    }
}

export const flushContext = () => {
    contextualExecutors = {}
}
