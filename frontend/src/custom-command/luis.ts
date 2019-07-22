import {roseliaCustomCommand, Entity, EntityType} from '@/common/api/luis'
import {tupleToDict} from '@/common/helpers'
import router from '@/router/index'


type ExecutorArgument = Partial<EntityType>

const getArguments = (entites: Entity[]): ExecutorArgument => tupleToDict(entites.map(el => [el.type, el.entity] as [string, string]))

export async function executeCommand(command: string) {
    const result = await roseliaCustomCommand({command})
    const intent = result.topScoringIntent.intent
    if (intent in executors) {
        executors[intent](getArguments(result.entities))
        return true
    }
    return false
}

const executors = {
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
    }
}