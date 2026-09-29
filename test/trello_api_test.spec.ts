import pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';

const BASE_URL: string =
process.env.TRELLO_BASE_URL || 'https://api.trello.com/1';

const KEY: string = process.env.TRELLO_API_KEY;
const TOKEN: string = process.env.TRELLO_API_TOKEN;
const BOARD_ID: string = process.env.TRELLO_BOARD_ID;

let LIST_ID: string;
let CARD_ID: string;

pactum.request.setBaseUrl(BASE_URL);

function authorized(spec) {
    return spec
    .withQueryParams('key', KEY)
    .withQueryParams('token', TOKEN);
}

describe('Trello API - Cards', () => {
    beforeAll(async () => {
        if (!KEY || !TOKEN || !BOARD_ID) {
            throw new Error(
                'Defina TRELLO_KEY, TRELLO_TOKEN e TRELLO_BOARD_ID no .env.',
            );
        }

        // ==========================================
        // 1. CRIA A LISTA
        // ==========================================

        const list = await authorized(
            pactum
            .spec()
            .post('/lists')
            .withQueryParams(
                'name',
                `Lista de teste ${faker.string.alphanumeric(8)}`,
            )
            .withQueryParams('idBoard', BOARD_ID),
        )
        .expectStatus(StatusCodes.OK)
        .toss();

        LIST_ID = list.body.id;

        expect(LIST_ID).toBeDefined();

        // ==========================================
        // 2. CRIA O CARD DENTRO DA LISTA
        // ==========================================

        const card = await authorized(
            pactum
            .spec()
            .post('/cards')
            .withQueryParams('idList', LIST_ID)
            .withQueryParams(
                'name',
                `Card de teste ${faker.string.alphanumeric(8)}`,
            ),
        )
        .expectStatus(StatusCodes.OK)
        .toss();

        CARD_ID = card.body.id;

        expect(CARD_ID).toBeDefined();
    });

    // ==========================================
    // TESTES
    // ==========================================

    test('GET /cards/{id} - deve buscar o card', async () => {
        await authorized(
            pactum
            .spec()
            .get(`/cards/${CARD_ID}`),
        )
        .expectStatus(StatusCodes.OK)
        .toss();
    });

    test('PUT /cards/{id} - deve alterar o card', async () => {
        const newName =
        `Card alterado ${faker.string.alphanumeric(8)}`;

        await authorized(
            pactum
            .spec()
            .put(`/cards/${CARD_ID}`)
            .withQueryParams('name', newName),
        )
        .expectStatus(StatusCodes.OK)
        .toss();
    });

    test('DELETE /cards/{id} - deve excluir o card', async () => {
        await authorized(
            pactum
            .spec()
            .delete(`/cards/${CARD_ID}`),
        )
        .expectStatus(StatusCodes.OK)
        .toss();
    });

    test('POST /cards - deve criar um card', async () => {
        const cardName = `Card de teste ${faker.string.alphanumeric(8)}`;

        const response = await authorized(
            pactum
            .spec()
            .post('/cards')
            .withQueryParams('idList', LIST_ID)
            .withQueryParams('name', cardName)
            .withQueryParams(
                'desc',
                'Card criado durante teste automatizado',
            ),
        )
        .expectStatus(StatusCodes.OK)
        .toss();

        CARD_ID = response.body.id;

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toBe(cardName);
        expect(response.body.idList).toBe(LIST_ID);
    });

    // ==========================================
    // LIMPEZA
    // ==========================================

    afterAll(async () => {
        if (CARD_ID) {
            await authorized(
                pactum
                .spec()
                .delete(`/cards/${CARD_ID}`)
            )
            .expectStatus(StatusCodes.OK)
            .toss();
        }

        if (LIST_ID) {
            await authorized(
                pactum
                .spec()
                .delete(`/lists/${LIST_ID}/closed`),
            )
            .expectStatus(StatusCodes.OK)
            .toss();
        }
    });
});
