const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const {getPhone, sendNote} = require("./amo.js")
const subscribe = require('./unisender.js')
const https = require('https');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

const name_ids = {
    "20502070":".amoCRM. Проиграл: ушли к конкурентам",
    "20511439":".amoCRM. Проиграл: дорого",
    "20502067":".amoCRM. Проиграл: не подходит расписание",
    "20577843":".amoCRM. Проиграл: не подходит возраст",
    "20577805":".amoCRM. Проиграл: недозвон",
    "20577806":".amoCRM. Проиграл: плохие причины",
    "20502076":".amoCRM. Проиграл: остальные",
    "20518663":".amoCRM. Проиграл: все причины"
}

const lists_ids = {
    "1536561":"20502070",
    "1160793":"20511439",
    "1900398": "20502067",
    "1900437":"20577843",
    "993360":"20577805",
    "1536573":"20577806",
    "1536555":"20577806",
    "5206560":"20577805",
    "1536543":"20577805",
}

const pipeline_ids = ['786568','804619','912136','1005492','1379250','826213']

// "Не заинтересован" - 1536546
// "Изменились планы" - 1536558
// "Ушли к конкурентам" -  1536561 : 20502070
// "Дорого" - 1160793 : 20511439
// "Далеко" - 1536564
// "Не беспокоить, сами свяжуться" - 1900395
// "Не подходит расписание" - 1900398 : 20502067
// "Не Интересует" - 1900404
// "Нет Интересующего курса" - 1900407
// "Не подходит возраст" - 1900437 : 20577843
// "Не дозвонились" - 993360 : 20577805
// "Долгий" -  3277437
// "Возврат" - 1536573 : 20577806
// "Офлайн" - 5941512
// "Комерческое предложение" - 1536555 : 20577806
// "Заявка от ребенка" - 5457666
// "Лид не ответил" - 5206560 : 20577805
// "Некачественная заявка" - 1536543 : 20577805
// "Дубль" - 1148709
// "Тест" - 0

app.post('/', async function (req, res) {
    res.send('OK')
    let lead_id = {};
    for (param in req.body){
        if (param == 'leads[status][0][id]'){
            lead_id = req.body[param]
            break;
        }
    }
    let info = await getPhone(lead_id)
    if (info.lead.status_id === 143 && pipeline_ids.findIndex(p=> p == info.lead.pipeline_id) > -1){
        let list = lists_ids[info.lead.loss_reason_id]
        if (list){
            list += ","
        }

        if (!info.contact.custom_fields_values){
            sendNote(lead_id, 'Ошибка импорта контакта в Unisender')
            return
        }

        let email = info.contact.custom_fields_values.find(f=>f.field_id==59222)
        if (!email){
            sendNote(lead_id, 'Ошибка импорта контакта в Unisender')
            return
        }

        let result = await subscribe(list, 
            email.values[0].value,
            info.contact.name
            )
        
        if (result = "result"){
            if (list){
                sendNote(lead_id, 'Импорт контактов в список рассылок "'+ name_ids[list.replace(',','')] +'" завершён')
            }
            sendNote(lead_id, 'Импорт контактов в список рассылок ".amoCRM. Проиграл: остальные" завершён')
            sendNote(lead_id, 'Импорт контактов в список рассылок ".amoCRM. Проиграл: все причины" завершён')
        }else{
            sendNote(lead_id, 'Ошибка импорта контакта в Unisender')
        }
    }
})

function DinoWakeUp(){
    setTimeout(async ()=>{
        await https.get('https://test-cdcom.herokuapp.com/test-cdcom')
        DinoWakeUp()
    }, 1500000)
}


app.listen(process.env.PORT || 80, ()=>{
    DinoWakeUp()
})