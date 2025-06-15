from datetime import timedelta

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Person(models.Model):
    name_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-Я\-]*$', 
        message="Location can only contain latin letters, cyrillic letters and hyphen"
    )
    
    name = models.CharField(max_length=100, validators=[name_validator],
                             help_text="ФИO человека.")
    date_birth = models.DateField(help_text="дата рождения.")
    description = models.TextField(help_text="Подробное описание человека: его внешний вид, привычки, работа.")
    
    
    def clean(self):
        age = timezone.now().date() - self.date_birth
        if age < timedelta(days=18 * 365):
            raise ValidationError("Date of birth must be at least 18 years ago.")
    
    def __str__(self):
        return f'Person {self.name}'
    
    class Meta:
        db_table = 'person'
        app_label = 'investigations'
        managed = True
    
    
class Case(models.Model):
    CASE_STATUS_CHOICES = [
        ('открыто', 'Открыто'),
        ('закрыто', 'Закрыто'),
        ('приостановлено', 'Приостановлено'),
    ]
    
    CASE_TYPE_CHOICES = [
        ('убийство', 'Убийство'),
        ('кража', 'Кража'),
        ('мошенничество', 'Мошенничество'),
        ('нападение', 'Нападение'),
        ('разбой', 'Разбой'),
        ('поджог', 'Поджог'),
        ('похищение', 'Похищение'),
        ('коррупция', 'Коррупция'),
        ('киберпреступность', 'Киберпреступность'),
        ('шпионаж', 'Шпионаж'),
        ('терроризм', 'Терроризм'),
        ('уклонение от налогов', 'Уклонение от уплаты налогов'),
        ('взяточничество', 'Взяточничество'),
        ('присвоение или растрата', 'Присвоение или растрата'),
        ('вандализм', 'Вандализм'),
        ('незаконная торговля', 'Незаконная торговля'),
        ('торговля людьми', 'Торговля людьми'),
        ('другое', 'Другое'),
    ]

    CASE_RESOLUTION_CHOICES = [
        ('не раскрыто', 'Не раскрыто'),
        ('раскрыто', 'Раскрыто'),
    ]

    description = models.TextField(help_text="описание дела и его обстоятельств.")
    date_opened = models.DateField(help_text="дата открытия уголовного дела.")
    date_closed = models.DateField(null=True, help_text="дата закрытия дела.")
    type = models.CharField(max_length=30, choices=CASE_TYPE_CHOICES, 
                            help_text="тип преступления, связанного с делом: кража, похищение...")  
    status = models.CharField(max_length=15, choices=CASE_STATUS_CHOICES, 
                              default='открыто', help_text="текущий процессуальный статус дела: открыто, закрыто, приостановлено.")
    resolution = models.CharField(max_length=11, choices=CASE_RESOLUTION_CHOICES, 
                                  default='не раскрыто', help_text="отражает результат дела: раскрыто, не раскрыто.")

    def clean(self):
        super().clean()
        today = timezone.now().date()

        if self.date_opened > today:
            raise ValidationError('The opening date of the case cannot be in the future.')

        if self.status == 'закрыто':
            if not self.date_closed:
                raise ValidationError('Closed cases must have a closing date.')
        else:
            if self.date_closed:
                raise ValidationError('Only closed cases may have a closing date.')
        
        if self.status not in [s[0] for s in self.CASE_STATUS_CHOICES]:
            raise ValidationError(f"Invalid case status: {self.status}")
        
        if self.type not in [t[0] for t in self.CASE_TYPE_CHOICES]:
            raise ValidationError(f"Invalid case type: {self.type}")

        if self.resolution not in [r[0] for r in self.CASE_RESOLUTION_CHOICES]:
            raise ValidationError(f"Invalid case resolution: {self.resolution}")
        
        if self.status == 'открыто' and self.resolution == 'раскрыто':
            raise ValidationError('An open case cannot be marked as solved.')

        if self.status == 'приостановлено' and self.resolution == 'раскрыто':
            raise ValidationError('A suspended case cannot be marked as solved.')

        if today - self.date_opened > timedelta(days=25*365):
            if self.status != 'закрыто':
                raise ValidationError('Cases older than 25 years must be closed.')
        
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(date_closed__gte=models.F('date_opened')) | Q(date_closed__isnull=True),
                name='date_closed_after_date_opened'
            )
        ]
        db_table = 'cases'
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Case {self.pk}"


class Suspect(models.Model):
    SUSPECT_STATUS = [
        ('в розыске', 'В розыске'),
        ('арестован', 'Арестован'),
        ('освобожден', 'Освобожден'),
        ('на свободе', 'на свободе'),
        ('выпущен под залог', 'Выпущен под залог'),
    ]
    
    person = models.OneToOneField(Person, on_delete=models.CASCADE, 
                                  help_text="человек, связанный с этим подозреваемым.")
    status = models.CharField(max_length=21, choices=SUSPECT_STATUS, 
                              help_text="статус подозреваемого в рамках дела: в розыске, арестован...")
    cases = models.ManyToManyField(Case, through='SuspectCase')
    
    def clean(self):
        super().clean()
        if self.status not in [s[0] for s in self.SUSPECT_STATUS]:
            raise ValidationError(f"Invalid suspect status: {self.status}")

    class Meta:
        db_table = 'suspect'
        app_label = 'investigations'
        managed = True
        
    def __str__(self):
        return f"Suspect {self.person.name}"

class SuspectCase(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, help_text="дело, к которому относится подозреваемый.")
    suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE, help_text="подозреваемый, связанный с делом.")
    
    class Meta:
        db_table = 'suspect_cases'
        app_label = 'investigations'
        managed = True
        
    def __str__(self):
        return f"{self.suspect} is a suspect in {self.case}"


class Article(models.Model):
    id = models.IntegerField(primary_key=True, help_text="номер статьи закона.")
    description = models.TextField(help_text="описание содержания статьи.")
    
    class Meta:
        db_table = 'article'
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Article {self.pk}"


class Charge(models.Model):
    CHARGE_STATUS = [
        ('ожидает решения', 'Ожидает решения'),
        ('осужден', 'Осужден'),
        ('отклонено', 'Отклонено'),
        ('прекращено', 'Прекращено'),
        ('аннулировано', 'Аннулировано'),
        ('перенесено', 'Перенесено'),
        ('обжаловано', 'Обжаловано'),
    ]

    article = models.ForeignKey(Article, on_delete=models.CASCADE,
                                help_text="cтатья, по которой выдвинуто обвинение.")
    suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE,
                                help_text="подозреваемый, против которого выдвинуто обвинение.")
    date_accusation = models.DateField(help_text="дата предъявления обвинения.")
    status = models.CharField(max_length=17, choices=CHARGE_STATUS,
                              help_text="текущий статус обвинения: осужден, отклонено...")
    
    def clean(self):
        super().clean()
        if self.date_accusation > timezone.now().date():
            raise ValidationError("The accusation date cannot be in the future.")
        
        if self.status not in [s[0] for s in self.CHARGE_STATUS]:
            raise ValidationError(f"Invalid charge status: {self.status}")
    
    class Meta:
        db_table = 'charge'
        app_label = 'investigations'
        managed = True
    
    def __str__(self):
        return f"Charge {self.pk}"


class Alibi(models.Model):
    ALIBI_STATUS = [
        ('подтверждено', 'Подтверждено'),
        ('не подтверждено', 'Не подтверждено'),
        ('ложное', 'Ложное'),
    ]

    status = models.CharField(max_length=15, choices=ALIBI_STATUS, 
                              help_text="cтатус алиби: подтверждено, не подтверждено, ложное.")
    case = models.ForeignKey(Case, on_delete=models.CASCADE, help_text="дело, к которому относится алиби.")
    description = models.TextField(help_text="описание алиби и обстоятельств.")
    suspect = models.OneToOneField(Suspect, on_delete=models.CASCADE, 
                                   help_text="подозреваемый, для которого указывается алиби.")
    
    class Meta:
        db_table = 'alibi'
        app_label = 'investigations'
        managed = True
    
    def clean(self):
        super().clean()
        if self.status not in [s[0] for s in self.ALIBI_STATUS]:
            raise ValidationError(f"Invalid alibi status: {self.status}")

    def __str__(self):
        return f"Alibi for {self.suspect}"


class Statement(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE,
                              help_text="дело, к которому относится показания.")
    person = models.ForeignKey(Person, on_delete=models.CASCADE, help_text="человек, давший заявление.")
    statement = models.TextField(help_text="текст показания.")
    date_of_statement = models.DateField(help_text="дата предоставления показания.")

    def clean(self):
        super().clean()
        if self.date_of_statement > timezone.now().date():
            raise ValidationError("The statement date cannot be in the future.")
        
    class Meta:
        db_table = 'statement'
        unique_together = ('case', 'person')
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Statement by {self.person.name}"

    
class CrimeScene(models.Model):
    location_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-Я0-9\s\.,;?!:\-()]*$', 
        message="Location can only contain latin letters, cyrillic letters, digits, spaces, and punctuation marks."
    )

    location = models.CharField(max_length=300, validators=[location_validator],
                                help_text="адрес места преступления.")
    date = models.DateField(help_text="дата преступления.")
    case = models.ForeignKey(Case, on_delete=models.CASCADE, 
                             help_text="дело, к которому относится место преступления.")
    
    class Meta:
        db_table = 'crime_scene'
        app_label = 'investigations'
        managed = True

    def clean(self):
        super().clean()
        if self.date > timezone.now().date():
            raise ValidationError("The crimeScene date cannot be in the future.")
        
    def __str__(self):
        return f"Scene at {self.location}"
    
    
class Evidence(models.Model):
    EVIDENCE_TYPE = [
        ('физическое', 'Физическое'),
        ('цифровое', 'Цифровое'),
        ('показания', 'Показания'),
        ('документальное', 'Документальное'),
        ('видеозапись', 'Видеозапись'),
        ('аудиозапись', 'Аудиозапись'),
        ('следы', 'Следы'),
        ('биологическое', 'Биологическое'),
        ('днк', 'ДНК'),
        ('фотографическое', 'Фотографическое'),
        ('электронное', 'Электронное'),
        ('другое', 'Другое'),
    ]

    type = models.CharField(max_length=15, choices=EVIDENCE_TYPE, 
                            help_text="тип доказательства, связанного с делом: физическое, цифровое...")
    description = models.TextField(help_text="описание доказательства.")
    date = models.DateField(help_text="Дата получения доказательства.")
    scene = models.ForeignKey(CrimeScene, on_delete=models.CASCADE,
                              help_text="место преступления, где было найдено доказательство.")
    
    class Meta:
        db_table = 'evidence'
        app_label = 'investigations'
        managed = True
    
    def clean(self):
        super().clean()
        if self.date > timezone.now().date():
            raise ValidationError("The evidence date cannot be in the future.")
        
        if self.type not in [t[0] for t in self.EVIDENCE_TYPE]:
            raise ValidationError(f"Invalid evidence type: {self.type}")
    
    def __str__(self):
        return f"Evidence {self.pk}"
