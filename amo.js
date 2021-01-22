const AmoCRM = require( 'amocrm-js' );
const mongoose = require("mongoose")
const mongodb_secret = process.env.mongodb_secret

const amo_client_id = process.env.amo_client_id
const amo_client_secret = process.env.amo_client_secret
const amo_redirect_uri = process.env.amo_redirect_uri
const amo_code = process.env.amo_code


mongoose.connect(mongodb_secret, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(()=>{
          console.log("Mongoose connected")})
          .catch((err)=>{console.log(err)})

const amoSchema = new mongoose.Schema({
    id: Number,
    token: {}
})

const Amo = mongoose.model('Amo', amoSchema);

const crm = new AmoCRM({
    // логин пользователя в портале, где адрес портала domain.amocrm.ru
    domain: 'codabra', // может быть указан полный домен вида domain.amocrm.ru, domain.amocrm.com
    /* 
      Информация об интеграции (подробности подключения 
      описаны на https://www.amocrm.ru/developers/content/oauth/step-by-step)
    */
    auth: {
      client_id: amo_client_id, // ID интеграции
      client_secret: amo_client_secret, // Секретный ключ
      redirect_uri: amo_redirect_uri, // Ссылка для перенаправления
      code: amo_code // Код авторизации
    },
});

async function _init(){
    let amo = await Amo.findOne({id:1})
    if (!amo){
        console.log("error")
    }
    await crm.connection.setToken(amo.token)
    await crm.connect()
}

_init()

crm.on('connection:authError', async (err) => {
    console.log('Ошибка connection:authError', err);
    let data = await crm.connection.refreshToken()
    
    authTokenSave(data)

})

crm.on('connection:connected', () => { 
    console.log('amocrm connected');} 
)

crm.on('connection:newToken', (token) => {
    console.log('newToken');
    authTokenSave(token)
})

async function authTokenSave(token){
    let amo = await Amo.findOne({id:1})
    if (!amo){
        new Amo({id: 1, token:token.data}).save()
    }
    else{
        amo.token = token.data;
        amo.save()
    }
}

async function sendNote(amo_id, text){
    await crm.request.post  ( '/api/v4/leads/'+ amo_id +'/notes',[{
        note_type : "service_message",
        params:{
            service: "Unisender",
            text: text
        }

    }] )
}

function getPhone(amo_id){
    let info={};
    return new Promise(async (resolve, reject)=>{
        let data = await crm.request.get( '/api/v4/leads/'+amo_id+'?with=contacts,source_id,' )
        info.lead = data.data;
        data = await crm.request.get( '/api/v4/contacts/'+ data.data._embedded.contacts[0].id )
        info.contact = data.data;
        resolve(info)
    })
}

module.exports = {getPhone, sendNote}

