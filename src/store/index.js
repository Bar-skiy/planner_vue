import {createStore, createLogger} from 'vuex'

export default createStore({
    plugins: [createLogger()],

    state() {
        return {
            title: '',
            description: '',
            deadline: '',
            valuestatus: 'статус не определён',
            colorstatus: 'badge',
            blocks: [],
            blockDB: {},
            loading: true
        }
    },
    getters: {
        btnDisabled(state) {
            if (state.title.length <= 0 ||
                state.description.length <= 0 ||
                state.deadline.length <= 0) {
                return true
            }
        },
        // комментарии: подсчет количества задач
        counterTask(state) {
            return state.blocks.length
        },
        counterProgress(state) {
            return state.blocks.reduce((acc, arr) => acc + (arr.valuestatus === 'в процессе' ? 1 : 0), 0);
        },
        counterFinalize(state) {
            return state.blocks.reduce((acc, arr) => acc + (arr.valuestatus === 'завершено' ? 1 : 0), 0);
        },
    },
    mutations: {
        createTsk(state) {
            state.blocksDB = {
                title: state.title,
                description: state.description,
                deadline: state.deadline,
                valuestatus: state.valuestatus,
                colorstatus: state.colorstatus,
                id: Date.now(),
            }
            state.blocks.push(state.blocksDB)
        },
        async submitTaskDB(state) {
            // комментарии: загрузка задачи в BD
            const response = await fetch('https://vue-planer-barskiy-default-rtdb.firebaseio.com/task.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstBlock: state.blocksDB
                })
            })
            const firebaseData = await response.json()
            // комментарии: добавление ключа базы данных для объекта задачи в объект задачи vuex
            state.blocks.find(b => b.id === (state.blocksDB.id)).keydb = firebaseData.name
        },
        async loadDataDB(state) {
            // комментарии: загрузка задач из BD при перезагрузке страниц
            state.loading = true
            const result = await fetch('https://vue-planer-barskiy-default-rtdb.firebaseio.com/task.json')
            const db = await result.json()
            // комментарии: пересборка массива задач для vuex
            state.blocks = Object.keys(db).map(key => {
                return {
                    title: db[key].firstBlock.title,
                    description: db[key].firstBlock.description,
                    deadline: db[key].firstBlock.deadline,
                    valuestatus: db[key].firstBlock.valuestatus,
                    colorstatus: db[key].firstBlock.colorstatus,
                    id: db[key].firstBlock.id,
                    keydb: key
                }
            })
            state.loading = false
        },
        async removeTask(state, payLoad) {
            // комментарии: удаление задачи в BD
            await fetch(`https://vue-planer-barskiy-default-rtdb.firebaseio.com/task/${payLoad.keydb}.json`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            // комментарии: удаление задачи в vuex
            state.blocks = state.blocks.filter(block => block.keydb !== payLoad.keydb)
        },
        async submitStatusDB(state, payLoad) {
            //комментарии: изменение статуса в vuex
            const blockchange = state.blocks.find(b => b.id === Number(payLoad.id))
            blockchange.valuestatus = payLoad.value
            blockchange.colorstatus = payLoad.color
            //комментарии: изменение статуса в BD
            await fetch(`https://vue-planer-barskiy-default-rtdb.firebaseio.com/task/${payLoad.keydb}/firstBlock.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(blockchange)
            })
        },
    },

    actions: {},
    modules: {}
})