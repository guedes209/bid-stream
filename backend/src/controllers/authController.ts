import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'E-mail já está em uso.' });
    }

    const user = await prisma.user.create({
      data: { name, email, password }
    });

    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (user as any).password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    return res.status(200).json({ 
      user: { id: user.id, name: user.name, email: user.email },
      token: user.id 
    });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
};
