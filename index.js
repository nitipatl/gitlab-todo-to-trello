#!/usr/bin/env node

const axios = require('axios')
const args = require('minimist')(process.argv.slice(2))

axios.defaults.headers.common['PRIVATE-TOKEN'] = args['gitlabToken']

const gitlabEndpoint = 'https://gitlab.com/api/v4'
const projectId = args['projectId']
const commitId = args['commitId']

const trelloEndpoint = 'https://api.trello.com/1'
const trelloKey = args['trelloKey']
const trelloToken = args['trelloToken']
const trelloBoardId = args['trelloBoardId']

const getTodos = async () => {
    const res = await axios.get(`${gitlabEndpoint}/projects/${projectId}/repository/commits/${commitId}/diff`)
    let { data } = await res;
    return data
}
const getTodoId = async () => {
    const res = await axios.get(`${trelloEndpoint}/boards/${trelloBoardId}/lists?fields=name&key=${trelloKey}&token=${trelloToken}`)
    let { data } = await res;
    return data.find(row => row.name == '@TODO').id
}
const addTask = async (todoId, name, desc) => {
    const res = await axios.post(`${trelloEndpoint}/cards?idList=idList&keepFromSource=all`, {
        name: name,
        desc: desc,
        idList: todoId,
        key: trelloKey,
        token: trelloToken,
    })
}
const main = async () => {
    let found = []
    const todos = await getTodos()
    todos.forEach(function (row) {
        const result = row.diff.match(/\+[^\r\n@]*@todo[^\:]*\:\s*([^\r?\n]+)\r?\n/i)
        if (result && result[1]) {
            found.push({
                file: row.new_path,
                task: result[1],
                diff: row.diff,
            })
        }
    })
    const todoId = await getTodoId()
    found.forEach(row => {
        addTask(todoId, `${row.task} - ${row.file}`, row.diff)
    })
    
}

main()

