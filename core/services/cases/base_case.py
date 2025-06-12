from abc import ABC, abstractmethod
from typing import final

from django.db import IntegrityError, transaction
from investigations.models import Case as InvestigationCase
from users.models import AvailableTable, Case


class BaseCase(ABC):
    title: str
    description: str
    required_xp: int
    reward_xp: int
    answer: str | int
    available_tables: list[str]

    @final
    def create(self) -> bool:
        try:
            with transaction.atomic(using='users'):
                case, created = Case.objects.using('users').get_or_create(
                    title=self.title,
                    defaults={
                        'description': self.description,
                        'required_xp': self.required_xp,
                        'reward_xp': self.reward_xp,
                        'answer': self.answer,
                    }
                )

                if not created:
                    return False

                for table_name in self.available_tables:
                    AvailableTable.objects.using('users').create(case=case, table=table_name)

                investigation_case = self.create_investigation()
                if investigation_case is None:
                    raise RuntimeError("Метод create_investigation() вернул None — кейс не создан")
                
                case.save()
                return True

        except IntegrityError as e:
            raise RuntimeError(f"Ошибка базы данных при создании кейса '{self.title}': {e}") from e

        except Exception as e:
            raise RuntimeError(f"Не удалось создать кейс '{self.title}': {type(e).__name__}: {e}") from e

    @abstractmethod
    def create_investigation(self) -> InvestigationCase | None:
        pass
