import express from 'express'
import db from '../db.js'
const router = express.Router()


/* GET lista de pessoas. */
router.get('/', async (req, res, next) => {

  try {
    const [people] = await db.execute({
      sql: 'SELECT * FROM person LEFT OUTER JOIN zombie ON eatenBy = zombie.id',

      // nestTables resolve conflitos de haver campos com mesmo nome nas tabelas
      // nas quais fizemos JOIN (neste caso, `person` e `zombie`).
      // descrição: https://github.com/felixge/node-mysql#joins-with-overlapping-column-names
      nestTables: true
    })


    // Exercício 3: negociação de conteúdo para esta resposta
    //
    // renderiza a view de listagem de pessoas, passando como contexto
    // de dados:
    // - people: com um array de `person`s do banco de dados
    // - success: com uma mensagem de sucesso, caso ela exista
    //   - por exemplo, assim que uma pessoa é excluída, uma mensagem de
    //     sucesso pode ser mostrada
    // - error: idem para mensagem de erro
    res.format({
      html: () => res.render('list-people', {
        people,
        success: req.flash('success'),
        error: req.flash('error')
      }),
      json: () => res.send(people)
    })

  } catch (error) {
    console.error(error)
    error.friendlyMessage = 'Problema ao recuperar pessoas'
    next(error)
  }
})


/* PUT altera pessoa para morta por um certo zumbi */
router.put('/eaten/', async (req, res, next) => {
  const zombieId = req.body.zombie
  const personId = req.body.person

  if (!zombieId || !personId) {
    req.flash('error', 'Nenhum id de pessoa ou zumbi foi passado!')
    res.redirect('/')
    return;
  }

  try {
    const [result] = await db.execute(`UPDATE person 
                                       SET alive=false, eatenBy=?
                                       WHERE id=?`,
      [zombieId, personId])
    if (result.affectedRows !== 1) {
      req.flash('error', 'Não há pessoa para ser comida.')
    } else {
      req.flash('success', 'A pessoa foi inteiramente (não apenas cérebro) engolida.')
    }

  } catch (error) {
    req.flash('error', `Erro desconhecido. Descrição: ${error}`)

  } finally {
    res.redirect('/')
  }

})


/* GET formulario de registro de nova pessoa */
router.get('/new/', (req, res) => {
  res.render('new-person', {
    success: req.flash('success'),
    error: req.flash('error')
  })
})


/* POST registra uma nova pessoa */
// Exercício 1: IMPLEMENTAR AQUI
// Dentro da callback de tratamento da rota:
//   1. Fazer a query de INSERT no banco
//   2. Redirecionar para a rota de listagem de pessoas
//      - Em caso de sucesso do INSERT, colocar uma mensagem feliz
//      - Em caso de erro do INSERT, colocar mensagem vermelhinha
router.post('/', async (req, res) => {
  const name = req.body.name;

  if (!name) {
    req.flash('error', 'Digite o nome da nova pessoa.');
    res.redirect('/people');
  }

  try {
    await db.execute(`INSERT INTO person (name, alive) VALUES (?, ?)`, [name, true])

    req.flash('success', `Pessoa com nome ${name} criada com sucesso!`);
  } catch (error) {
    await transaction.rollback();

    console.error(e);
  } finally {
    transaction.release();

    res.redirect('/people');
  }
});

/* DELETE uma pessoa */
// Exercício 2: IMPLEMENTAR AQUI
// Dentro da callback de tratamento da rota:
//   1. Fazer a query de DELETE no banco
//   2. Redirecionar para a rota de listagem de pessoas
//      - Em caso de sucesso do INSERT, colocar uma mensagem feliz
//      - Em caso de erro do INSERT, colocar mensagem vermelhinha
router.delete('/:id', async (req, res) => {
  const id = req.params.id

  if (!id) throw new Error("Favor informar o ID da pessoa")

  try {
    await db.execute(`DELETE FROM person WHERE id=?;`, [id]);
    req.flash('success', `Pessoa excluída com id = ${id} excluída com sucesso!`);
  } catch (error) {
    console.error(error);
    req.flash('error', `Não foi posível excluir a pessoa com id = ${id}.`);
  } finally {
    res.redirect('/people');
  }
});


export default router
