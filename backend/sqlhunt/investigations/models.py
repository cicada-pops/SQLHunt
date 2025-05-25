from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q


class Person(models.Model):
    name_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-Я\-]*$', 
        message="Location can only contain latin letters, cyrillic letters and hyphen"
    )
    
    name = models.CharField(max_length=100, validators=[name_validator])
    date_birth = models.DateField()
    description = models.TextField()
    
    
    def clean(self):
        age = timezone.now().date() - self.date_birth
        if age < timedelta(days=18 * 365):
            raise ValidationError("Date of birth must be at least 18 years ago.")
    
    def __str__(self):
        return f'Person {self.name}'
    
    class Meta:
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

    description = models.TextField()
    date_opened = models.DateField()
    date_closed = models.DateField(null=True)
    type = models.CharField(max_length=30, choices=CASE_TYPE_CHOICES)  
    status = models.CharField(max_length=15, choices=CASE_STATUS_CHOICES, default='открыто')

    def clean(self):
        super().clean()
        
        if self.date_opened > timezone.now().date():
            raise ValidationError('The opening date of the case cannot be in the future.')

        if self.date_closed and self.status != 'закрыто':
            raise ValidationError('If the case has a closing date, its status must be closed.')
        
        if self.status not in [s[0] for s in self.CASE_STATUS_CHOICES]:
            raise ValidationError(f"Invalid case status: {self.status}")
        
        if self.type not in [t[0] for t in self.CASE_TYPE_CHOICES]:
            raise ValidationError(f"Invalid case type: {self.type}")
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(date_closed__gte=models.F('date_opened')) | Q(date_closed__isnull=True),
                name='date_closed_after_date_opened'
            )
        ]
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Case {self.pk}"


class Suspect(models.Model):
    SUSPECT_STATUS = [
        ('в розыске', 'В розыске'),
        ('арестован', 'Арестован'),
        ('освобожден', 'Освобожден'),
        ('выпущен под залог', 'Выпущен под залог'),
    ]
    
    person = models.OneToOneField(Person, on_delete=models.CASCADE)
    status = models.CharField(max_length=21, choices=SUSPECT_STATUS)
    cases = models.ManyToManyField(Case)
    
    def clean(self):
        super().clean()
        if self.status not in [s[0] for s in self.SUSPECT_STATUS]:
            raise ValidationError(f"Invalid suspect status: {self.status}")

    class Meta:
        app_label = 'investigations'
        managed = True
        
    def __str__(self):
        return f"Подозреваемый {self.person.name}"


class Article(models.Model):
    description = models.TextField()
    
    class Meta:
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Article {self.pk}"


class Charge(models.Model):
    CHARGE_STATUS = [
        ('ожидает решения', 'Ожидает решения'),
        ('осуждён', 'Осуждён'),
        ('отклонено', 'Отклонено'),
        ('прекращено', 'Прекращено'),
        ('аннулировано', 'Аннулировано'),
        ('перенесено', 'Перенесено'),
        ('обжаловано', 'Обжаловано'),
    ]

    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    suspect = models.ForeignKey(Suspect, on_delete=models.CASCADE)
    date_accusation = models.DateField()
    status = models.CharField(max_length=17, choices=CHARGE_STATUS)
    
    def clean(self):
        super().clean()
        if self.date_accusation > timezone.now().date():
            raise ValidationError("The accusation date cannot be in the future.")
        
        if self.status not in [s[0] for s in self.CHARGE_STATUS]:
            raise ValidationError(f"Invalid charge status: {self.status}")
    
    class Meta:
        app_label = 'investigations'
        managed = True
    
    def __str__(self):
        return f"Charge {self.pk}"


class Alibi(models.Model):
    ALIBI_STATUS = [
        ('подтверждено', 'Подтверждено'),
        ('неподтверждено', 'Неподтверждено'),
        ('ложное', 'Ложное'),
    ]

    status = models.CharField(max_length=15, choices=ALIBI_STATUS)
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    description = models.TextField()
    suspect = models.OneToOneField(Suspect, on_delete=models.CASCADE)
    
    class Meta:
        app_label = 'investigations'
        managed = True
    
    def clean(self):
        super().clean()
        if self.status not in [s[0] for s in self.ALIBI_STATUS]:
            raise ValidationError(f"Invalid alibi status: {self.status}")

    def __str__(self):
        return f"Alibi for {self.suspect}"


class Statement(models.Model):
    alibi = models.ForeignKey(Alibi, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    statement = models.TextField()
    date_statement = models.DateField()

    def clean(self):
        super().clean()
        if self.date_statement > timezone.now().date():
            raise ValidationError("The statement date cannot be in the future.")
        
    class Meta:
        unique_together = ('alibi', 'person')
        app_label = 'investigations'
        managed = True

    def __str__(self):
        return f"Statement by {self.person.name}"
    
    
class CrimeScene(models.Model):
    location_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-Я0-9\s\.,;?!:\-()]*$', 
        message="Location can only contain latin letters, cyrillic letters, digits, spaces, and punctuation marks."
    )

    location = models.CharField(max_length=300, validators=[location_validator])
    date = models.DateField()
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    
    class Meta:
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

    type = models.CharField(max_length=15, choices=EVIDENCE_TYPE)
    description = models.TextField()
    date = models.DateField()
    scene = models.ForeignKey(CrimeScene, on_delete=models.CASCADE)
    
    class Meta:
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