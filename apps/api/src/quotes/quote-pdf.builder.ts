import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';

type DecimalLike = { toString(): string };

interface Party {
    name: string;
    company?: string | null;
    businessName?: string | null;
    rfc?: string | null;
    email?: string | null;
}

export interface QuotePdfData {
    folio: string;
    title: string;
    status: string;
    currency: string;
    taxRate: DecimalLike;
    subtotal: DecimalLike;
    taxAmount: DecimalLike;
    total: DecimalLike;
    notes: string | null;
    terms: string | null;
    validUntil: Date | null;
    createdAt: Date;
    acceptedAt: Date | null;
    issuer: Party;
    client: Party;
    items: Array<{
        description: string;
        unit: string | null;
        quantity: DecimalLike;
        unitPrice: DecimalLike;
        amount: DecimalLike;
    }>;
}

export type QuotePdfKind = 'quote' | 'contract';

const toNumber = (value: DecimalLike) => Number(value.toString());

const money = (value: DecimalLike, currency: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(toNumber(value));

const decimal = (value: DecimalLike) =>
    new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(toNumber(value));

const longDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' }).format(date);

const right = (text: string, bold = false): TableCell => ({ text, alignment: 'right', bold });

function partyBlock(label: string, party: Party): Content {
    const displayName = party.businessName ?? party.company ?? party.name;
    return {
        stack: [
            { text: label, style: 'label' },
            { text: displayName, bold: true },
            ...(displayName !== party.name ? [{ text: party.name }] : []),
            ...(party.rfc ? [{ text: `RFC: ${party.rfc}` }] : []),
            ...(party.email ? [{ text: party.email }] : []),
        ],
    };
}

function itemsTable(data: QuotePdfData): Content {
    return {
        table: {
            headerRows: 1, // se repite en cada página si la tabla es larga
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
                ['Concepto', 'Cantidad', 'Unidad', 'P. unitario', 'Importe'].map(
                    (text): TableCell => ({ text, style: 'tableHeader' }),
                ),
                ...data.items.map((item): TableCell[] => [
                    item.description,
                    right(decimal(item.quantity)),
                    item.unit ?? '',
                    right(money(item.unitPrice, data.currency)),
                    right(money(item.amount, data.currency)),
                ]),
            ],
        },
        layout: 'lightHorizontalLines',
    };
}

function totalsBlock(data: QuotePdfData): Content {
    return {
        columns: [
            { width: '*', text: '' },
            {
                width: 'auto',
                table: {
                    body: [
                        ['Subtotal', right(money(data.subtotal, data.currency))],
                        [`IVA (${decimal(data.taxRate)}%)`, right(money(data.taxAmount, data.currency))],
                        [{ text: 'Total', bold: true }, right(money(data.total, data.currency), true)],
                    ],
                },
                layout: 'noBorders',
            },
        ],
        margin: [0, 8, 0, 16],
    };
}

function contractClauses(data: QuotePdfData): Content[] {
    const provider = data.issuer.businessName ?? data.issuer.name;
    const client = data.client.company ?? data.client.name;
    const clause = (title: string, text: string): Content => ({
        text: [{ text: `${title}. `, bold: true }, text],
        margin: [0, 0, 0, 8],
        alignment: 'justify',
    });

    return [
        {
            text: [
                'Contrato de prestación de servicios que celebran por una parte ',
                { text: provider, bold: true },
                ', en lo sucesivo "EL PRESTADOR", y por la otra ',
                { text: client, bold: true },
                ', en lo sucesivo "EL CLIENTE", al tenor de las siguientes cláusulas:',
            ],
            alignment: 'justify',
            margin: [0, 0, 0, 12],
        },
        clause(
            'PRIMERA. Objeto',
            `EL PRESTADOR se obliga a realizar el proyecto "${data.title}", conforme a los conceptos detallados en el presente documento, derivados de la cotización ${data.folio}.`,
        ),
        clause(
            'SEGUNDA. Contraprestación',
            `EL CLIENTE pagará a EL PRESTADOR la cantidad total de ${money(data.total, data.currency)} (${data.currency}), impuestos incluidos, conforme al desglose de conceptos.`,
        ),
        clause('TERCERA. Forma de pago', data.terms ?? 'Según lo acordado por las partes.'),
        clause(
            'CUARTA. Propiedad intelectual',
            'Una vez cubierto el pago total, los derechos patrimoniales sobre los entregables finales se transfieren a EL CLIENTE. EL PRESTADOR podrá mostrar el trabajo realizado como parte de su portafolio profesional, salvo acuerdo en contrario por escrito.',
        ),
        clause(
            'QUINTA. Confidencialidad',
            'Ambas partes se obligan a mantener la confidencialidad de la información que reciban con motivo de este contrato y a no divulgarla sin autorización de la otra parte.',
        ),
        clause(
            'SEXTA. Terminación anticipada',
            'Cualquiera de las partes podrá dar por terminado este contrato mediante aviso por escrito con quince días naturales de anticipación. En tal caso, EL CLIENTE pagará los trabajos realizados hasta la fecha de terminación.',
        ),
        clause(
            'SÉPTIMA. Relación entre las partes',
            'Este contrato es de naturaleza civil. EL PRESTADOR actúa de manera independiente, con sus propios medios, por lo que no existe relación laboral ni de subordinación entre las partes.',
        ),
        clause(
            'OCTAVA. Jurisdicción',
            'Para la interpretación y cumplimiento de este contrato, las partes se someten a las leyes aplicables y a los tribunales competentes del domicilio de EL PRESTADOR, renunciando a cualquier otro fuero que pudiera corresponderles.',
        ),
    ];
}

function signatures(data: QuotePdfData): Content {
    const line = (label: string, name: string): Content => ({
        stack: [
            { text: '', margin: [0, 50, 0, 0] },
            { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 220, y2: 0, lineWidth: 0.5 }] },
            { text: name, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
            { text: label, alignment: 'center', style: 'label' },
        ],
    });

    return {
        columns: [
            line('EL PRESTADOR', data.issuer.businessName ?? data.issuer.name),
            line('EL CLIENTE', data.client.company ?? data.client.name),
        ],
        unbreakable: true, // las firmas nunca quedan partidas entre dos páginas
    };
}

export function buildQuotePdf(data: QuotePdfData, kind: QuotePdfKind): TDocumentDefinitions {
    const isContract = kind === 'contract';
    const docTitle = isContract ? 'CONTRATO DE PRESTACIÓN DE SERVICIOS' : 'COTIZACIÓN';
    const docDate = isContract && data.acceptedAt ? data.acceptedAt : data.createdAt;

    const header: Content = {
        columns: [
            partyBlock('De', data.issuer),
            {
                width: 'auto',
                stack: [
                    { text: docTitle, style: 'docTitle' },
                    { text: data.folio, alignment: 'right', bold: true },
                    { text: longDate(docDate), alignment: 'right' },
                    ...(!isContract && data.validUntil
                        ? [{ text: `Vigencia: ${longDate(data.validUntil)}`, alignment: 'right' as const }]
                        : []),
                ],
            },
        ],
        margin: [0, 0, 0, 20],
    };

    const body: Content[] = isContract
        ? [
            ...contractClauses(data),
            { text: 'Desglose de conceptos', style: 'sectionTitle' },
            itemsTable(data),
            totalsBlock(data),
            signatures(data),
        ]
        : [
            partyBlock('Para', data.client),
            { text: data.title, style: 'sectionTitle' },
            itemsTable(data),
            totalsBlock(data),
            ...(data.terms ? [{ text: 'Términos y condiciones', style: 'sectionTitle' }, { text: data.terms }] : []),
            ...(data.notes ? [{ text: 'Notas', style: 'sectionTitle' }, { text: data.notes }] : []),
        ];

    return {
        info: { title: `${docTitle} ${data.folio}`, author: data.issuer.businessName ?? data.issuer.name },
        pageSize: 'LETTER',
        pageMargins: [40, 40, 40, 50],
        ...(!isContract && data.status === 'DRAFT' && {
            watermark: { text: 'BORRADOR', opacity: 0.08, bold: true },
        }),
        footer: (currentPage: number, pageCount: number) => ({
            text: `${data.folio} · Página ${currentPage} de ${pageCount}`,
            alignment: 'center',
            fontSize: 8,
            color: '#888888',
        }),
        content: [header, ...body],
        defaultStyle: { fontSize: 10, lineHeight: 1.25 },
        styles: {
            docTitle: { fontSize: 14, bold: true, alignment: 'right', margin: [0, 0, 0, 4] },
            sectionTitle: { fontSize: 11, bold: true, margin: [0, 16, 0, 6] },
            tableHeader: { bold: true, fillColor: '#f2f2f2' },
            label: { fontSize: 8, color: '#666666' },
        },
    };
}