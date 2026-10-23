import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

const DEFAULT_SERVICES = [
    { name: 'Sitio web', estimatedHours: 20 },
    { name: 'Automatización administrativa', estimatedHours: 35 },
    { name: 'Agenda y gestión de clientes', estimatedHours: 50 },
    { name: 'Control de inventario', estimatedHours: 70 },
];

@Injectable()
export class ServicesService {
    constructor(private readonly prisma: PrismaService) { }

    findAll(userId: string) {
        return this.prisma.service.findMany({
            where: { userId },
            orderBy: [{ estimatedHours: 'asc' }, { name: 'asc' }],
        });
    }

    create(userId: string, dto: CreateServiceDto) {
        // El DTO solo aporta datos (no se usan sus métodos), por eso es seguro esparcirlo
        // oxlint-disable-next-line typescript/no-misused-spread
        return this.prisma.service.create({ data: { ...dto, userId } });
    }

    async update(userId: string, id: string, dto: UpdateServiceDto) {
        await this.findOwned(userId, id);
        return this.prisma.service.update({ where: { id }, data: dto });
    }

    async remove(userId: string, id: string) {
        await this.findOwned(userId, id);
        // Los conceptos ya creados a partir del servicio son copias independientes: borrar es seguro
        await this.prisma.service.delete({ where: { id } });
    }

    async seedDefaults(userId: string) {
        if ((await this.prisma.service.count({ where: { userId } })) > 0) {
            throw new ConflictException('Ya tienes servicios en tu catálogo');
        }
        await this.prisma.service.createMany({ data: DEFAULT_SERVICES.map((service) => ({ ...service, userId })) });
        return this.findAll(userId);
    }

    private async findOwned(userId: string, id: string) {
        const service = await this.prisma.service.findFirst({ where: { id, userId } });
        if (!service) throw new NotFoundException('Servicio no encontrado');
        return service;
    }
}