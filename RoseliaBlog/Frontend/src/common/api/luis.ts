import {makeApi} from './protocol'

interface Intent {
    intent: string
    score: number
}

export interface Entity {
    entity: string
    type: keyof EntityType
    startIndex: number
    endIndex: number
    score: number
}

interface ILuisCommand {
    query: string
    topScoringIntent: Intent
    intents: Intent[]
    entities: Entity[]
}

export interface EntityType {
    Username: string
    Password: string
    PostID: string
    PostTag: string
    PostTitle: string
    "Calendar.EndDate": string
    "Calendar.StartDate": string
}

export const roseliaCustomCommand = makeApi<{command: string}, ILuisCommand>('get', 'luis/run-command')

export const askYukina = makeApi<{question: string}, string[]>('get', 'luis/ask-yukina')
