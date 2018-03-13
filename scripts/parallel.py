import multiprocessing

MX_PROCESS_NUM = multiprocessing.cpu_count()


class MultiConsumer(multiprocessing.Process):
    def __init__(self, queue, poison_pill=-1):
        super(MultiConsumer, self).__init__()
        self.queue = queue
        self.poison_pill = poison_pill

    def preload(self):
        pass

    def execute(self, task):
        pass

    def encounter_end(self):
        pass

    def run(self):
        self.preload()
        while True:
            try:
                task = self.queue.get()
            except Exception as e:
                self.encounter_end()
                break
            if task == self.poison_pill:
                self.encounter_end()
                break
            self.execute(task)


class MultiProducer(multiprocessing.Process):
    def __init__(self, consumer_type=MultiConsumer):
        super(MultiProducer, self).__init__()
        self.queue = multiprocessing.Queue()
        self.consumer_type = consumer_type
        self.poison_pill = -1

    def add_task(self, task):
        self.queue.put(task)

    def task_put(self):
        pass

    def encounter_end(self):
        pass

    def run(self):
        self.workers = [self.consumer_type(self.queue, self.poison_pill) for i in range(MX_PROCESS_NUM)]
        for worker in self.workers:
            worker.start()

        self.task_put()

        for _ in self.workers:
            self.add_task(self.poison_pill)

        for worker in self.workers:
            worker.join()

        self.encounter_end()


