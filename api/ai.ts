import OpenAI from 'openai';
import type {
  NarrativeEchoError,
  NarrativeEchoRequest,
  NarrativeEchoResponse,
  NarrativeEchoTone,
} from '../src/shared/aiEcho';

const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-5.4';
const SYSTEM_PROMPT = [
  'Voce e roteirista de um jogo narrativo brasileiro, urbano e sobrenatural.',
  'Escreva sempre em portugues do Brasil.',
  'Mantenha o texto curto, humano, melancolico e visual.',
  'Nao mencione IA, prompt, JSON, sistema ou metadados.',
  'Nao contradiga os dados da run.',
  'A fala da Aiko deve ter uma unica frase curta.',
  'A reflexao deve ter entre duas e tres frases curtas.',
  'O resultado precisa soar como um eco final da demo.',
].join(' ');

const echoSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Titulo curto com duas a quatro palavras.',
    },
    aikoAfterline: {
      type: 'string',
      description: 'Uma fala curta da Aiko apos o desfecho.',
    },
    reflection: {
      type: 'string',
      description: 'Uma reflexao curta em duas ou tres frases.',
    },
  },
  required: ['title', 'aikoAfterline', 'reflection'],
  additionalProperties: false,
} as const;

function json(body: NarrativeEchoResponse | NarrativeEchoError, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  });
}

function isFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNarrativeEchoRequest(value: unknown): value is NarrativeEchoRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const body = value as Record<string, unknown>;
  const result = body.result as Record<string, unknown> | undefined;
  const ending = body.ending as Record<string, unknown> | undefined;

  return Boolean(
    result &&
      ending &&
      isFiniteNumber(result.dependency) &&
      isFiniteNumber(result.trust) &&
      isFiniteNumber(result.autonomy) &&
      isFiniteNumber(result.forcedChainCount) &&
      (result.chosenPath === 'trust' || result.chosenPath === 'dependency' || result.chosenPath === null) &&
      typeof ending.title === 'string' &&
      typeof ending.text === 'string' &&
      typeof ending.aikoLine === 'string',
  );
}

function isEchoDraft(
  value: unknown,
): value is Pick<NarrativeEchoResponse, 'title' | 'aikoAfterline' | 'reflection'> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === 'string' &&
    typeof draft.aikoAfterline === 'string' &&
    typeof draft.reflection === 'string'
  );
}

function clampMetric(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferTone(payload: NarrativeEchoRequest): NarrativeEchoTone {
  const { trust, dependency, autonomy, forcedChainCount, chosenPath } = payload.result;

  if (forcedChainCount >= 3 || dependency >= trust + 15 || chosenPath === 'dependency') {
    return 'oppressive';
  }

  if (autonomy >= 45 && trust >= dependency) {
    return 'hopeful';
  }

  return 'fragile';
}

function getGatewayToken(request: Request) {
  return (
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    request.headers.get('x-vercel-oidc-token') ||
    ''
  );
}

function buildPrompt(payload: NarrativeEchoRequest, tone: NarrativeEchoTone) {
  const { result, ending } = payload;

  return [
    'Crie um eco final para a run abaixo.',
    `Tom esperado: ${tone}.`,
    `Titulo do final atual: ${ending.title}`,
    `Texto do final atual: ${ending.text}`,
    `Fala atual da Aiko: ${ending.aikoLine}`,
    `Confianca: ${clampMetric(result.trust)}`,
    `Dependencia: ${clampMetric(result.dependency)}`,
    `Autonomia: ${clampMetric(result.autonomy)}`,
    `Correntes forcadas usadas: ${Math.max(0, Math.round(result.forcedChainCount))}`,
    `Caminho escolhido: ${result.chosenPath ?? 'nenhum'}`,
    'Entregue um titulo novo, uma fala nova da Aiko e uma reflexao curta.',
    'Evite repetir as frases recebidas literalmente.',
  ].join('\n');
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return json(
        { error: 'Use POST em /api/ai para gerar o eco narrativo.' },
        { status: 405, headers: { Allow: 'POST' } },
      );
    }

    const gatewayToken = getGatewayToken(request);
    if (!gatewayToken) {
      return json(
        {
          error: 'AI Gateway nao configurado.',
          detail:
            'Defina AI_GATEWAY_API_KEY nas envs do projeto ou habilite OIDC no Vercel para expor o token da funcao.',
        },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Payload invalido. Envie JSON valido.' }, { status: 400 });
    }

    if (!isNarrativeEchoRequest(body)) {
      return json(
        {
          error: 'Payload incompleto.',
          detail: 'O endpoint espera result e ending com os campos da run final.',
        },
        { status: 400 },
      );
    }

    const tone = inferTone(body);
    const client = new OpenAI({
      apiKey: gatewayToken,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    try {
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        stream: false,
        max_tokens: 280,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(body, tone) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'narrative_echo',
            description: 'Eco narrativo curto para a tela final da demo.',
            schema: echoSchema,
          },
        },
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error('A resposta do modelo veio vazia.');
      }

      const parsed = JSON.parse(rawContent) as unknown;
      if (!isEchoDraft(parsed)) {
        throw new Error('A resposta estruturada veio fora do formato esperado.');
      }

      return json({
        title: parsed.title.trim(),
        aikoAfterline: parsed.aikoAfterline.trim(),
        reflection: parsed.reflection.trim(),
        tone,
        model: DEFAULT_MODEL,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Falha desconhecida.';
      return json(
        {
          error: 'Falha ao gerar o eco narrativo.',
          detail,
        },
        { status: 500 },
      );
    }
  },
};
