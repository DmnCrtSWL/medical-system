import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, QuestionnaireStatus } from '@prisma/client';
import prisma from '../config/db';

const MAX_ANSWER_LENGTH = 5000;

/**
 * Normaliza las respuestas: solo acepta texto o listas de texto, con longitud acotada.
 */
const sanitizeAnswers = (raw: unknown): Record<string, string | string[]> => {
  const result: Record<string, string | string[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z0-9_]{1,64}$/.test(key)) continue;
    if (typeof value === 'string') {
      result[key] = value.slice(0, MAX_ANSWER_LENGTH);
    } else if (Array.isArray(value)) {
      result[key] = value.filter((v) => typeof v === 'string').slice(0, 50).map((v) => (v as string).slice(0, 500));
    }
  }
  return result;
};

/**
 * 1. (ADMIN) Genera un link único de cuestionario para un cliente
 */
export const createQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const respondentName = String(req.body?.respondentName || '').trim();
    if (!respondentName) {
      res.status(400).json({ message: 'Indica el nombre del cliente o empresa.' });
      return;
    }

    const questionnaire = await prisma.questionnaireResponse.create({
      data: {
        respondentName,
        token: crypto.randomBytes(18).toString('base64url'),
      },
    });

    res.status(201).json({ id: questionnaire.id, token: questionnaire.token, respondentName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear el cuestionario';
    console.error('Error al crear cuestionario:', message);
    res.status(500).json({ message: 'Error interno al crear el cuestionario' });
  }
};

/**
 * 2. (ADMIN) Lista los cuestionarios con sus respuestas
 */
export const listQuestionnaires = async (_req: Request, res: Response): Promise<void> => {
  try {
    const questionnaires = await prisma.questionnaireResponse.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ questionnaires });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al listar cuestionarios';
    console.error('Error al listar cuestionarios:', message);
    res.status(500).json({ message: 'Error interno al listar cuestionarios' });
  }
};

/**
 * 3. (Público por token) Obtiene el cuestionario y las respuestas guardadas
 */
export const getQuestionnaireByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaire = await prisma.questionnaireResponse.findUnique({ where: { token: req.params.token } });
    if (!questionnaire) {
      res.status(404).json({ message: 'Este link no es válido.' });
      return;
    }
    res.status(200).json({
      respondentName: questionnaire.respondentName,
      answers: questionnaire.answers,
      status: questionnaire.status,
      updatedAt: questionnaire.updatedAt,
      submittedAt: questionnaire.submittedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener el cuestionario';
    console.error('Error al obtener cuestionario:', message);
    res.status(500).json({ message: 'Error interno al cargar el cuestionario' });
  }
};

/**
 * 4. (Público por token) Guarda avance o envía el cuestionario
 */
export const saveQuestionnaireByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.questionnaireResponse.findUnique({ where: { token: req.params.token } });
    if (!existing) {
      res.status(404).json({ message: 'Este link no es válido.' });
      return;
    }

    const submit = Boolean(req.body?.submit);
    const updated = await prisma.questionnaireResponse.update({
      where: { id: existing.id },
      data: {
        answers: sanitizeAnswers(req.body?.answers) as Prisma.InputJsonValue,
        ...(submit ? { status: QuestionnaireStatus.SUBMITTED, submittedAt: new Date() } : {}),
      },
    });

    res.status(200).json({ status: updated.status, updatedAt: updated.updatedAt, submittedAt: updated.submittedAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar el cuestionario';
    console.error('Error al guardar cuestionario:', message);
    res.status(500).json({ message: 'Error interno al guardar tus respuestas' });
  }
};
