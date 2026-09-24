import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { definitionState, validateFormDefinition } from '../src/modules/formularios/application/service';
import type { FormDefinition } from '../src/modules/formularios/domain/types';

// Conteúdo oficial dos instrumentos PENRISK e QUALIPEN (enunciados, alternativas,
// pontuações e faixas fornecidos pelos responsáveis). Usado apenas para
// cadastrá-los no banco como formulários comuns; depois disso eles são editados
// pelo painel administrativo como qualquer outro formulário.

function authors() {
  return [
    'Chriss Taylor', 'Jonshon Aliven', 'Trikien Munaska', 'Khabian Jerry',
    'Chriss Taylor', 'Jonshon Aliven', 'Trikien Munaska', 'Trikien Munaska',
  ].map((name, index) => ({
    id: `autor-${index + 1}`,
    name,
    institution: 'Internal Medicine',
    imageDataUrl: imageDataUrl(`autor${index + 1}.jpg`),
  }));
}

const standardResultBands = [
  { id: 'baixo', minScore: 0, maxScore: 33, risk: 'Risco Baixo', description: '' },
  { id: 'medio', minScore: 34, maxScore: 66, risk: 'Risco Médio', description: '' },
  { id: 'alto', minScore: 67, maxScore: 100, risk: 'Risco Alto', description: '' },
];

function imageDataUrl(file: string) {
  return `data:image/jpeg;base64,${readFileSync(path.join(process.cwd(), 'scripts/assets', file)).toString('base64')}`;
}

const penriskPrompts: Array<[string, string]> = [
  ['hygiene', 'Você puxa a pele do pênis e lava a cabeça do pênis diariamente com água e sabão?'],
  ['foreskin-retraction', 'Ao puxar a pele do pênis, você consegue colocar a cabeça do pênis para fora?'],
  ['odor', 'Você ou alguém do seu convívio íntimo já sentiu mau cheiro no seu pênis?'],
  ['skin-change', 'Você percebeu alguma mudança na cor ou textura da pele do pênis?'],
  ['hpv', 'Você já foi diagnosticado com o vírus do HPV por algum profissional da saúde?'],
  ['hiv', 'Você já foi diagnosticado com o vírus da AIDS por algum profissional da saúde?'],
  ['discharge', 'A cabeça do seu pênis apresenta alguma secreção esbranquiçada?'],
  ['wound', 'A pele ou a cabeça do seu pênis apresenta alguma ferida ou sangramento?'],
  ['smoking', 'Você fuma ou fumou por muito tempo?'],
  ['infections', 'Você já teve infecções no pênis?'],
  ['itching', 'Você apresenta ou apresentou recentemente coceira na pele ou na cabeça do pênis?'],
  ['warts', 'Você tem verruga no pênis?'],
  ['animal-sex', 'Você já fez sexo com animais?'],
];

const qualipenPrompts = [
  'Percebi algum sangramento no meu pênis no último mês.',
  'Senti mau cheiro no meu pênis no último mês.',
  'Senti alguma dificuldade ou incômodo para urinar no último mês.',
  'Senti dor ou desconforto no meu pênis no último mês.',
  'Observei algum inchaço na minha região genital ou virilha no último mês.',
  'Senti cansaço ou falta de energia para realizar minhas atividades do dia a dia no último mês.',
  'Senti alguma dificuldade para ter ou manter ereção no último mês.',
  'A doença afetou o meu desejo sexual no último mês.',
  'Senti vergonha ou insegurança em relação a minha vida sexual no último mês.',
  'A doença prejudicou a forma como eu me relaciono sexualmente com minha parceira ou parceiro no último mês.',
  'Senti que a minha masculinidade foi afetada pela doença no último mês.',
  'A doença afetou o meu prazer sexual no último mês.',
  'Eu me senti triste ou desanimado por causa da doença no último mês.',
  'Senti medo em relação à doença ou ao futuro no último mês.',
  'Senti vergonha ou constrangimento por causa da doença no último mês.',
  'A doença afetou a minha autoestima ou confiança no último mês.',
  'Eu me senti ansioso por causa da doença no último mês.',
  'Eu me senti estressado por causa da doença no último mês.',
  'A doença dificultou minha convivência com familiares e amigos no último mês.',
  'Não recebi apoio da minha família e amigos para lidar com a doença no último mês.',
  'Evitei atividades sociais (por exemplo, sair de casa, ir à igreja, ir à casa de um parente) por causa da doença no último mês.',
  'Tive dificuldades para acessar serviços de saúde para consultas e exames no último mês.',
  'Evitei praticar exercícios físicos ou esportes (por exemplo, caminhadas, corridas, futebol) por causa da doença no último mês.',
  'A doença afetou minha capacidade de trabalhar ou de manter minha rotina no último mês.',
];

const likertAlternatives = [
  { id: 'discordo-totalmente', label: 'Discordo totalmente', score: -2 },
  { id: 'discordo-um-pouco', label: 'Discordo um pouco', score: -1 },
  { id: 'neutro', label: 'Nem discordo, nem concordo', score: 0 },
  { id: 'concordo-um-pouco', label: 'Concordo um pouco', score: 1 },
  { id: 'concordo-totalmente', label: 'Concordo totalmente', score: 2 },
];

export function officialInstruments(): Array<{ catalogKey: string; definition: FormDefinition }> {
  return [
    {
      catalogKey: 'PENRISK',
      definition: validateFormDefinition({
        schemaVersion: 1,
        title: 'PENRISK',
        description: 'Esta avaliação ajuda a identificar seu risco de desenvolver câncer de pênis. Quanto mais cedo for detectado, maiores são as chances de um tratamento bem sucedido.',
        imageDataUrl: imageDataUrl('penrisk.jpg'),
        authors: authors(),
        // Regra fornecida: cada Sim vale 1 e cada Não vale 0.
        questions: penriskPrompts.map(([id, prompt]) => ({
          id,
          prompt,
          type: 'two-options',
          alternatives: [
            { id: `${id}-sim`, label: 'Sim', score: 1 },
            { id: `${id}-nao`, label: 'Não', score: 0 },
          ],
        })),
        resultBands: standardResultBands,
      }),
    },
    {
      catalogKey: 'QUALIPEN',
      definition: validateFormDefinition({
        schemaVersion: 1,
        title: 'QUALIPEN',
        description: 'Esta avaliação tem o objetivo de entender como o câncer de pênis afeta a sua vida. Suas respostas nos ajudarão a entender o impacto da doença no seu dia a dia.',
        imageDataUrl: imageDataUrl('qualipen.jpg'),
        authors: authors(),
        questions: qualipenPrompts.map((prompt, index) => ({
          id: `q${index + 1}`,
          prompt,
          type: 'likert',
          alternatives: likertAlternatives,
        })),
        resultBands: standardResultBands,
      }),
    },
  ];
}

// Cadastra os instrumentos como formulários publicados. Idempotente: só
// preenche linhas ainda sem perguntas e nunca sobrescreve edições do painel.
export async function applyOfficialInstruments(client: PoolClient, fallbackOwnerId: string) {
  const report: string[] = [];
  for (const { catalogKey, definition } of officialInstruments()) {
    if (definitionState(definition) !== 'complete') throw new Error(`INSTRUMENT_INCOMPLETE:${catalogKey}`);
    const json = JSON.stringify(definition);
    const rows = await client.query<{ id: string; has_questions: boolean }>(
      `select id, jsonb_array_length(coalesce(definition->'questions', '[]'::jsonb)) > 0 as has_questions
         from app_private.admin_forms where upper(catalog_key) = $1 for update`,
      [catalogKey],
    );
    if (!rows.rowCount) {
      await client.query(
        `insert into app_private.admin_forms (owner_id, catalog_key, title, description, status, definition_state,
                definition, revision, published_definition, published_revision, published_at)
         values ($1, $2, $3, $4, 'published', 'complete', $5::jsonb, 0, $5::jsonb, 0, now())`,
        [fallbackOwnerId, catalogKey, definition.title, definition.description, json],
      );
      report.push(`${catalogKey}: criado e publicado`);
      continue;
    }
    for (const row of rows.rows) {
      if (row.has_questions) { report.push(`${catalogKey}: mantido (já possui perguntas cadastradas)`); continue; }
      await client.query(
        `update app_private.admin_forms
            set title = $2, description = $3, definition = $4::jsonb, definition_state = 'complete',
                revision = revision + 1, updated_at = now(),
                published_definition = case when status = 'published' then $4::jsonb else published_definition end,
                published_revision = case when status = 'published' then revision + 1 else published_revision end,
                published_at = case when status = 'published' then now() else published_at end
          where id = $1`,
        [row.id, definition.title, definition.description, json],
      );
      report.push(`${catalogKey}: preenchido`);
    }
  }
  return report;
}
