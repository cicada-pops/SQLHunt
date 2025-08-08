from core.services.generator.data_generator import InvestigationsDataGenerator
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Генерирует учебные данные для базы investigations"

    def add_arguments(self, parser):
        parser.add_argument(
            "--persons", type=int, default=1500, help="Количество персон"
        )
        parser.add_argument(
            "--suspects", type=int, default=500, help="Количество подозреваемых"
        )
        parser.add_argument(
            "--charges", type=int, default=100, help="Количество обвинений"
        )
        parser.add_argument(
            "--clear", action="store_true", help="Очистить все данные и выйти"
        )

    def handle(self, *args, **options):
        generator = InvestigationsDataGenerator()

        if options["clear"]:
            self.stdout.write(self.style.WARNING("Очищаем данные investigations..."))
            generator.clear_all_data()
            self.stdout.write(self.style.SUCCESS("Данные успешно очищены."))
            return
        
        if generator.has_data():
            self.stdout.write(self.style.WARNING("Данные investigations уже существуют, генерация пропущена."))
            return

        self.stdout.write(
            self.style.WARNING("Генерация новых данных...")
        )
        generator.run(
            persons=options["persons"],
            suspects=options["suspects"],
            charges=options["charges"],
        )
        self.stdout.write(self.style.SUCCESS("Генерация завершена успешно."))
