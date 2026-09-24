import './admin-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';
import { validateFormDefinition, definitionState } from '../src/modules/formularios/application/service';
import { createForm, updateFormStatus } from '../src/modules/formularios/infrastructure/repository';
import { applyOfficialInstruments } from './instrumentos-oficiais';

// Synthetic form used only to validate the scoring engine end-to-end (motor
// de pontuação / faixas). Not a real clinical instrument — do not treat its
// questions, weights or bands as PENRISK/QUALIPEN content.
const TEST_CATALOG_KEY = 'TESTE-E2E';

function testFormDefinition() {
  function question(id: string, prompt: string) {
    return {
      id,
      prompt,
      type: 'two-options' as const,
      alternatives: [
        { id: `${id}-nao`, label: 'Não', score: 0 },
        { id: `${id}-sim`, label: 'Sim', score: 10 },
      ],
    };
  }
  return {
    schemaVersion: 1 as const,
    title: '[TESTE] Formulário de validação',
    description: 'Formulário sintético usado apenas para validar o motor de pontuação ponta a ponta. Não é um instrumento clínico real.',
    imageDataUrl: null,
    authors: [],
    questions: [
      question('q1', 'Pergunta de teste 1?'),
      question('q2', 'Pergunta de teste 2?'),
      question('q3', 'Pergunta de teste 3?'),
    ],
    // minScore/maxScore are a percentage of the producible score range
    // (0–100), per the standard classification (até 33% / 34–66% / acima de
    // 66%) — not the raw 0–30 score this synthetic form happens to produce.
    resultBands: [
      { id: 'baixo', minScore: 0, maxScore: 33, risk: 'Risco Baixo', description: 'Faixa de teste: risco baixo.' },
      { id: 'moderado', minScore: 34, maxScore: 66, risk: 'Risco Médio', description: 'Faixa de teste: risco médio.' },
      { id: 'alto', minScore: 67, maxScore: 100, risk: 'Risco Alto', description: 'Faixa de teste: risco alto.' },
    ],
  };
}

async function main() {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const owner = await client.query<{ id: string }>(
      'select id from app_private.admin_users where username_normalized = $1',
      ['admin01'],
    );
    if (!owner.rowCount) throw new Error('ADMIN_NOT_FOUND');
    const ownerId = owner.rows[0].id;
    for (const line of await applyOfficialInstruments(client, ownerId)) console.log(line);
    await client.query('commit');

    const existingTestForm = await client.query(
      'select 1 from app_private.admin_forms where owner_id = $1 and catalog_key = $2',
      [ownerId, TEST_CATALOG_KEY],
    );
    if (!existingTestForm.rowCount) {
      const definition = validateFormDefinition(testFormDefinition());
      const state = definitionState(definition);
      const created = await createForm(ownerId, TEST_CATALOG_KEY, definition, state);
      await updateFormStatus(ownerId, created.id, 'published', created.revision);
      console.log('Formulário sintético de teste (TESTE-E2E) criado e publicado.');
    }

    console.log('Formulários iniciais verificados para admin01.');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    if (error instanceof Error && error.message === 'ADMIN_NOT_FOUND') {
      console.error('Não foi possível semear formulários: o usuário admin01 não existe. Nenhuma alteração foi feita.');
    } else {
      console.error('Não foi possível semear formulários. Nenhuma alteração foi confirmada.');
    }
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().finally(() => closePool().catch(() => undefined));
