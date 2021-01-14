const AmoCRM = require( 'amocrm-js' );
const mongoose = require("mongoose")

mongoose.connect("mongodb+srv://tasa:Zeleboba991106@cluster0.okx1n.mongodb.net/codabra?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})
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
      client_id: '7cb9bf4d-74e1-4a7a-8621-9dec26fcfa53', // ID интеграции
      client_secret: 'MrlHjVli9sA6BzLRKdyOu9PGehCFyD5HSeDH6dzAg28OXfsSJ06xjitedsMxskwz', // Секретный ключ
      redirect_uri: 'https://codabra-discord-new.herokuapp.com/', // Ссылка для перенаправления
      code: 'def502006fbd256adc289c61aecb82155dd32f79f0826587de0ad1623b8c4731e7c8227a1ad588a9d38ae4107483821498f0a15d5ed70ed2fa1c0a9ca6c69f4b9670eb15166bcee99e4f88e7aa8c642fcbe8bddd0a72fa3ef9a16c462d7554c0d8cf1ec9594236a7cc70aa04b94b8456aec1b5045f9555e9cdef065491205604b8f4a02ba0a823ab34ac58fa23d9e717f42e33fc05c5655cd4940532365c3cffb897ad0c40be0df3a0239b60d50087f7f6c5deec162893f3083890f0ce1e1bd43453645189c55fbd40e13579fb1ee88a236c7c5959381472af8e82fcaec15804f1ac2143b113a353934885448fcecf07622c51ceb751541a40b5f12cbba67c70c9d26ec1013dd037facae85bdcf82074700af95eeb7acfd2081d29ca25af7ad8de7fe69fae134ac32ed541c83bec70a9080eea3efd6e5457211c12b43bb5aed9723622260cfbc8c79972d42a768200d6bc9d53dd60d17a12c1a1e067bbdf4db81e57c83880f7901f559fef5404e4db0fb2b7153972b842f707c3d97ea8c505d3b625834ab47439524c7e17d4528a8842cb47bef37da6c05fc6b7a4a8028c7041554628ab340eee31dbce87cf8d3fcb26dc5bbf4c50d6befef994b1f3d699ffe6e0caf7f472cd3b52fda45dfa2306f645f360cc77c1' // Код авторизации
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

