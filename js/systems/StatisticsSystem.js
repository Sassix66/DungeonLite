export class StatisticsSystem {
  constructor(context, stateAccessor) {
    this.context = context;
    this.stateAccessor = stateAccessor;
    this.unsubscribers = [];
  }

  start() {
    this.unsubscribers.push(
      this.context.events.on(
        "enemy:defeated",
        ({ enemy }) => {
          const state = this.stateAccessor();

          state.stats.enemiesKilled += 1;

          if (enemy?.boss) {
            state.stats.bossesKilled += 1;
          }
        }
      )
    );

    this.unsubscribers.push(
      this.context.events.on(
        "chest:opened",
        () => {
          this.stateAccessor().stats.chestsOpened += 1;
        }
      )
    );

    this.unsubscribers.push(
      this.context.events.on(
        "tile:explored",
        () => {
          this.stateAccessor().stats.exploredTiles += 1;
        }
      )
    );

    this.unsubscribers.push(
      this.context.events.on(
        "item:found",
        () => {
          this.stateAccessor().stats.itemsFound += 1;
        }
      )
    );
  }

  stop() {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }

    this.unsubscribers = [];
  }
}
