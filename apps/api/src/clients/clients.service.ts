import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { ListClientsQueryDto } from './dto/list-clients-query.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, query: ListClientsQueryDto) {
        const { page, pageSize, search } = query;

        const where: Prisma.ClientWhereInput = {
            userId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { rfc: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        // Ambas consultas en una sola transacción: el total y la página son consistentes
        const [data, total] = await this.prisma.$transaction([
            this.prisma.client.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { _count: { select: { quotes: true } } },
            }),
            this.prisma.client.count({ where }),
        ]);

        return {
            data,
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }

    async findOne(userId: string, id: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, userId },
            include: { _count: { select: { quotes: true } } },
        });
        if (!client) throw new NotFoundException('Cliente no encontrado');
        return client;
    }

    create(userId: string, dto: CreateClientDto) {
        return this.prisma.client.create({ data: { ...dto, userId } });
    }

    async update(userId: string, id: string, dto: UpdateClientDto) {
        await this.findOne(userId, id); // valida que exista y sea del usuario
        return this.prisma.client.update({ where: { id }, data: dto });
    }

    async remove(userId: string, id: string) {
        const client = await this.findOne(userId, id);
        if (client._count.quotes > 0) {
            throw new ConflictException(
                `No se puede eliminar: el cliente tiene ${client._count.quotes} cotización(es)`,
            );
        }
        await this.prisma.client.delete({ where: { id } });
    }
}