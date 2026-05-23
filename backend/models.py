"""
Modelos Pydantic para validación de datos de entrada y salida de la API.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum
import uuid
from datetime import datetime


class PrioridadEnum(str, Enum):
    alta  = "alta"    # → valor numérico 1 (sale primero del Heap)
    media = "media"   # → valor numérico 2
    baja  = "baja"    # → valor numérico 3


class EstadoEnum(str, Enum):
    pendiente   = "pendiente"
    en_transito = "en_transito"
    entregado   = "entregado"
    cancelado   = "cancelado"


PRIORIDAD_A_NUMERO = {
    PrioridadEnum.alta:  1,
    PrioridadEnum.media: 2,
    PrioridadEnum.baja:  3,
}


# ── Request bodies ────────────────────────────────────────────────────────────

class PaqueteCreate(BaseModel):
    origen: str = Field(..., example="Bogotá")
    destino: str = Field(..., example="Cartagena")
    descripcion: str = Field(..., example="Laptop Dell XPS 15")
    peso_kg: float = Field(..., gt=0, le=1000, example=2.5)
    prioridad: PrioridadEnum = Field(PrioridadEnum.media)

    @field_validator("origen", "destino")
    @classmethod
    def no_vacios(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Ciudad no puede estar vacía")
        return v


class EstadoUpdate(BaseModel):
    estado: EstadoEnum


# ── Response models ───────────────────────────────────────────────────────────

class PaqueteResponse(BaseModel):
    id: str
    origen: str
    destino: str
    descripcion: str
    peso_kg: float
    prioridad: str
    estado: str
    distancia_km: float
    ruta: list[str]
    creado_en: str

    class Config:
        from_attributes = True


class RutaResponse(BaseModel):
    origen: str
    destino: str
    distancia_km: float
    ruta: list[str]
    posible: bool


class GrafoResponse(BaseModel):
    nodos: list[dict]
    aristas: list[dict]
