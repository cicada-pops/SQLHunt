import importlib.util
import inspect
import os
from pathlib import Path

from .cases.base_case import BaseCase

CASES_DIR = Path(__file__).parent / "cases"


def load_all_cases():
    case_classes = []

    files = sorted(
        f for f in os.listdir(CASES_DIR) if f.startswith("case") and f.endswith(".py")
    )
    for file in files:
        module_name = f"core.services.case_loader.cases.{file[:-3]}"

        try:
            spec = importlib.util.find_spec(module_name)
            if not spec or not spec.loader:
                raise ImportError(
                    f"Не удалось найти загрузчик для модуля: {module_name}"
                )

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)  # type: ignore
        except Exception as e:
            raise ImportError(
                f"Ошибка при загрузке или выполнении модуля {module_name}: {e}"
            ) from e

        for _, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, BaseCase) and obj is not BaseCase:
                case_classes.append(obj)

    return case_classes
